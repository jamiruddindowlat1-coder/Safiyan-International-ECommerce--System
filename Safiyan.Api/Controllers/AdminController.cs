using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        var totalRevenue = await _context.Orders
            .AsNoTracking()
            .Where(o => o.PaymentStatus == PaymentStatus.Paid)
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

        return Ok(new { user.Id, user.Role, message = "User role updated successfully." });
    }

    public sealed class UpdateRoleRequest
    {
        public string Role { get; set; } = string.Empty;
    }
}
