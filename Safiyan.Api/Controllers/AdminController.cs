using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using Safiyan.Core.Enums;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<object>> GetDashboard()
    {
        // Revenue includes paid orders only when the order is NOT cancelled
        // or returned. This keeps cancelled/returned orders out of revenue
        // without deleting or changing any order data.
        var totalRevenue = await _context.Orders
            .AsNoTracking()
            .Where(o =>
                o.PaymentStatus == PaymentStatus.Paid &&
                o.Status != OrderStatus.Cancelled &&
                o.Status != OrderStatus.Returned)
            .SumAsync(o => (decimal?)o.TotalAmount) ?? 0m;

        var totalOrders = await _context.Orders.CountAsync();
        var totalCustomers = await _context.Users.CountAsync(u => u.Role == "Customer");
        var totalProducts = await _context.Products.CountAsync();
        var lowStockProducts = await _context.Products.CountAsync(p => p.StockQuantity <= 10);
        var pendingOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Pending);
        var totalVendors = await _context.Vendors.CountAsync();

        var recentOrders = await _context.Orders
            .AsNoTracking()
            .Include(o => o.User)
            .OrderByDescending(o => o.CreatedAt)
            .Take(10)
            .Select(o => new
            {
                o.Id,
                o.OrderNumber,
                CustomerName = o.User.FullName,
                o.TotalAmount,
                o.Status,
                o.PaymentStatus,
                o.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            totalRevenue,
            totalOrders,
            totalCustomers,
            totalProducts,
            lowStockProducts,
            pendingOrders,
            totalVendors,
            recentOrders
        });
    }

    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<object>>> GetUsers()
    {
        var users = await _context.Users
            .AsNoTracking()
            .OrderBy(user => user.FullName)
            .Select(user => new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Phone,
                user.Role,
                user.IsActive,
                user.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPatch("users/{id:int}/role")]
    public async Task<IActionResult> UpdateUserRole(int id, UpdateRoleRequest request)
    {
        if (request == null || !Enum.TryParse<UserRole>(request.Role, true, out var role))
            return BadRequest(new { message = "Role must be Customer, Vendor, or Admin." });

        var user = await _context.Users.FirstOrDefaultAsync(item => item.Id == id);
        if (user == null)
            return NotFound(new { message = "User not found." });

        if (user.Role.Equals("Admin", StringComparison.OrdinalIgnoreCase) && role != UserRole.Admin)
        {
            var adminCount = await _context.Users.CountAsync(item => item.Role == "Admin" && item.IsActive);
            if (adminCount <= 1)
                return Conflict(new { message = "The last active admin cannot be demoted." });
        }

        user.Role = role.ToString();
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            user.Id,
            user.Role,
            message = "User role updated successfully."
        });
    }

    [HttpGet("customers")]
    public async Task<ActionResult<IEnumerable<object>>> GetCustomers()
    {
        var customers = await _context.Users
            .AsNoTracking()
            .Where(u => u.Role == "Customer")
            .OrderBy(u => u.FullName)
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.Phone,
                u.Role,
                u.IsActive,
                u.CreatedAt
            })
            .ToListAsync();

        return Ok(customers);
    }

    [HttpPost("customers")]
    public async Task<ActionResult<object>> CreateCustomer(CreateCustomerRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "Customer data is required." });

        if (string.IsNullOrWhiteSpace(request.FullName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Name, email, and password are required." });

        if (request.Password.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters." });

        var email = request.Email.Trim().ToLowerInvariant();

        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == email))
            return Conflict(new { message = "An account with this email already exists." });

        var user = new Safiyan.Core.Entities.User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            Phone = request.Phone?.Trim() ?? string.Empty,
            PasswordHash = HashPassword(request.Password),
            Role = "Customer",
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCustomers), new { id = user.Id }, new
        {
            user.Id,
            user.FullName,
            user.Email,
            user.Phone,
            user.Role,
            user.IsActive,
            user.CreatedAt
        });
    }

    [HttpPut("customers/{id:int}")]
    public async Task<IActionResult> UpdateCustomer(int id, UpdateCustomerRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "Customer data is required." });

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.Role == "Customer");

        if (user == null)
            return NotFound(new { message = "Customer not found." });

        if (string.IsNullOrWhiteSpace(request.FullName) ||
            string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { message = "Name and email are required." });

        var email = request.Email.Trim().ToLowerInvariant();

        if (await _context.Users.AnyAsync(u => u.Id != id && u.Email.ToLower() == email))
            return Conflict(new { message = "Another account already uses this email." });

        user.FullName = request.FullName.Trim();
        user.Email = email;
        user.Phone = request.Phone?.Trim() ?? string.Empty;
        user.IsActive = request.IsActive;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            if (request.Password.Length < 6)
                return BadRequest(new { message = "Password must be at least 6 characters." });

            user.PasswordHash = HashPassword(request.Password);
        }

        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("customers/{id:int}")]
    public async Task<IActionResult> DeleteCustomer(int id)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.Role == "Customer");

        if (user == null)
            return NotFound(new { message = "Customer not found." });

        if (await _context.Orders.AnyAsync(o => o.UserId == id))
        {
            return BadRequest(new
            {
                message = "This customer has order history and cannot be deleted. Deactivate the account instead."
            });
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPatch("customers/{id:int}/status")]
    public async Task<IActionResult> UpdateCustomerStatus(
        int id,
        CustomerStatusRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.Role == "Customer");

        if (user == null)
            return NotFound(new { message = "Customer not found." });

        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            user.Id,
            user.IsActive,
            message = "Customer status updated successfully."
        });
    }

    private static string HashPassword(string password)
    {
        const int iterations = 100_000;
        const int saltSize = 16;
        const int keySize = 32;

        var salt = RandomNumberGenerator.GetBytes(saltSize);

        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            keySize);

        return $"{iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public sealed class CreateCustomerRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Password { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }

    public sealed class UpdateCustomerRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Password { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public sealed class CustomerStatusRequest
    {
        public bool IsActive { get; set; }
    }

    public sealed class UpdateRoleRequest
    {
        public string Role { get; set; } = string.Empty;
    }
}
