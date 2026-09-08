using System.Security.Cryptography;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Safiyan.Core.Entities;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    // POST: api/Auth/register
    [HttpPost("register")]
    public async Task<ActionResult<object>> Register(RegisterRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "Registration data is required." });

        if (string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest(new { message = "Full name is required." });

        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { message = "Email is required." });

        if (string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Password is required." });

        if (request.Password.Length < 6)
            return BadRequest(new
            {
                message = "Password must be at least 6 characters."
            });

        var email = request.Email.Trim().ToLowerInvariant();

        var emailExists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == email);

        if (emailExists)
            return Conflict(new
            {
                message = "An account with this email already exists."
            });

        var role = string.IsNullOrWhiteSpace(request.Role)
            ? "Customer"
            : request.Role.Trim();

        if (!IsValidRole(role))
            return BadRequest(new
            {
                message = "Invalid role. Allowed roles: Customer, Vendor, Admin."
            });

        // Public registration must not create an Admin account.
        if (role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
            role = "Customer";

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = HashPassword(request.Password),
            Phone = request.Phone?.Trim() ?? string.Empty,
            Role = NormalizeRole(role),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Registration successful.",
            token = CreateToken(user),
            user = new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Phone,
                user.Role,
                user.IsActive,
                user.CreatedAt
            }
        });
    }

    // POST: api/Auth/login
    [HttpPost("login")]
    public async Task<ActionResult<object>> Login(LoginRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "Login data is required." });

        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { message = "Email is required." });

        if (string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Password is required." });

        var email = request.Email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email);

        if (user == null)
        {
            return Unauthorized(new
            {
                message = "Invalid email or password."
            });
        }

        if (!user.IsActive)
        {
            return Unauthorized(new
            {
                message = "This account is inactive."
            });
        }

        var passwordValid = VerifyPassword(
            request.Password,
            user.PasswordHash
        );

        if (!passwordValid)
        {
            return Unauthorized(new
            {
                message = "Invalid email or password."
            });
        }

        return Ok(new
        {
            message = "Login successful.",
            token = CreateToken(user),
            user = new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Phone,
                user.Role,
                user.IsActive,
                user.CreatedAt
            }
        });
    }

    // GET: api/Auth/user/5
    [HttpGet("user/{id:int}")]
    public async Task<ActionResult<object>> GetUser(int id)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Where(u => u.Id == id)
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.Phone,
                u.Role,
                u.IsActive,
                u.CreatedAt,
                u.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (user == null)
            return NotFound(new { message = "User not found." });

        return Ok(user);
    }

    // PUT: api/Auth/user/5
    [HttpPut("user/{id:int}")]
    public async Task<IActionResult> UpdateUser(
        int id,
        UpdateUserRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "User data is required." });

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound(new { message = "User not found." });

        if (string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest(new { message = "Full name is required." });

        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { message = "Email is required." });

        var email = request.Email.Trim().ToLowerInvariant();

        var emailExists = await _context.Users
            .AnyAsync(u =>
                u.Id != id &&
                u.Email.ToLower() == email);

        if (emailExists)
        {
            return Conflict(new
            {
                message = "Another account already uses this email."
            });
        }

        user.FullName = request.FullName.Trim();
        user.Email = email;
        user.Phone = request.Phone?.Trim() ?? string.Empty;
        user.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            if (request.Password.Length < 6)
            {
                return BadRequest(new
                {
                    message = "Password must be at least 6 characters."
                });
            }

            user.PasswordHash = HashPassword(request.Password);
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "User updated successfully.",
            user = new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Phone,
                user.Role,
                user.IsActive,
                user.UpdatedAt
            }
        });
    }

    // PATCH: api/Auth/user/5/status
    [HttpPatch("user/{id:int}/status")]
    public async Task<IActionResult> UpdateUserStatus(
        int id,
        StatusRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound(new { message = "User not found." });

        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = user.IsActive
                ? "User activated successfully."
                : "User deactivated successfully.",
            user.Id,
            user.IsActive
        });
    }

    private static bool IsValidRole(string role)
    {
        return role.Equals("Customer", StringComparison.OrdinalIgnoreCase)
            || role.Equals("Vendor", StringComparison.OrdinalIgnoreCase)
            || role.Equals("Admin", StringComparison.OrdinalIgnoreCase);
    }

    private string CreateToken(User user)
    {
        var key = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key is not configured.");
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string NormalizeRole(string role)
    {
        if (role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
            return "Admin";

        if (role.Equals("Vendor", StringComparison.OrdinalIgnoreCase))
            return "Vendor";

        return "Customer";
    }

    private static string HashPassword(string password)
    {
        const int iterations = 100_000;
        const int saltSize = 16;
        const int keySize = 32;

        byte[] salt = RandomNumberGenerator.GetBytes(saltSize);

        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            keySize
        );

        return $"{iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    private static bool VerifyPassword(
        string password,
        string storedHash)
    {
        try
        {
            var parts = storedHash.Split('.');

            if (parts.Length != 3)
                return false;

            if (!int.TryParse(parts[0], out var iterations))
                return false;

            var salt = Convert.FromBase64String(parts[1]);
            var expectedHash = Convert.FromBase64String(parts[2]);

            var actualHash = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                iterations,
                HashAlgorithmName.SHA256,
                expectedHash.Length
            );

            return CryptographicOperations.FixedTimeEquals(
                actualHash,
                expectedHash
            );
        }
        catch
        {
            return false;
        }
    }

    public class RegisterRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Role { get; set; } = "Customer";
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class UpdateUserRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Password { get; set; }
    }

    public class StatusRequest
    {
        public bool IsActive { get; set; }
    }
}
