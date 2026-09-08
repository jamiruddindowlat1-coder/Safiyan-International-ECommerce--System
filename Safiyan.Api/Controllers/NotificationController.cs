using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public NotificationController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("user/{userId:int}")]
    public async Task<ActionResult<IEnumerable<object>>> GetUserNotifications(int userId)
    {
        var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
        if (!userExists)
            return NotFound(new { message = "User not found." });

        var notifications = await _context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new
            {
                n.Id,
                n.UserId,
                n.Title,
                n.Message,
                n.Type,
                n.IsRead,
                n.CreatedAt,
                n.ReadAt
            })
            .ToListAsync();

        return Ok(notifications);
    }

    [HttpPost]
    public async Task<ActionResult<Notification>> CreateNotification(CreateNotificationRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "Notification data is required." });

        if (request.UserId <= 0)
            return BadRequest(new { message = "Valid UserId is required." });

        var userExists = await _context.Users.AnyAsync(u => u.Id == request.UserId);
        if (!userExists)
            return NotFound(new { message = "User not found." });

        var notification = new Notification
        {
            UserId = request.UserId,
            Title = request.Title ?? "Notification",
            Message = request.Message ?? string.Empty,
            Type = request.Type ?? "info",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUserNotifications), new { userId = notification.UserId }, notification);
    }

    [HttpPatch("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id);
        if (notification == null)
            return NotFound(new { message = "Notification not found." });

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            notification.Id,
            notification.IsRead,
            notification.ReadAt,
            message = "Notification marked as read."
        });
    }

    public class CreateNotificationRequest
    {
        public int UserId { get; set; }
        public string? Title { get; set; }
        public string? Message { get; set; }
        public string? Type { get; set; }
    }
}
