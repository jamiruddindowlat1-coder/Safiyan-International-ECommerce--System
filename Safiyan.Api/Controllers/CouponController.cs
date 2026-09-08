using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class CouponController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CouponController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetCoupons()
    {
        var coupons = await _context.Coupons
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.Code,
                c.Description,
                c.DiscountPercentage,
                c.MaximumDiscountAmount,
                c.MinimumOrderAmount,
                c.UsageLimit,
                c.UsedCount,
                c.StartDate,
                c.EndDate,
                c.IsActive,
                c.CreatedAt
            })
            .ToListAsync();

        return Ok(coupons);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<object>> GetCoupon(int id)
    {
        var coupon = await _context.Coupons
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new
            {
                c.Id,
                c.Code,
                c.Description,
                c.DiscountPercentage,
                c.MaximumDiscountAmount,
                c.MinimumOrderAmount,
                c.UsageLimit,
                c.UsedCount,
                c.StartDate,
                c.EndDate,
                c.IsActive,
                c.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (coupon == null)
            return NotFound(new { message = "Coupon not found." });

        return Ok(coupon);
    }

    [HttpPost]
    public async Task<ActionResult<Coupon>> CreateCoupon(CreateCouponRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "Coupon data is required." });

        if (string.IsNullOrWhiteSpace(request.Code))
            return BadRequest(new { message = "Coupon code is required." });

        if (request.DiscountPercentage < 0 || request.DiscountPercentage > 100)
            return BadRequest(new { message = "Discount percentage must be between 0 and 100." });

        var exists = await _context.Coupons.AnyAsync(c => c.Code.ToLower() == request.Code.Trim().ToLower());
        if (exists)
            return Conflict(new { message = "A coupon with this code already exists." });

        var coupon = new Coupon
        {
            Code = request.Code.Trim(),
            Description = request.Description ?? string.Empty,
            DiscountPercentage = request.DiscountPercentage,
            MaximumDiscountAmount = request.MaximumDiscountAmount,
            MinimumOrderAmount = request.MinimumOrderAmount,
            UsageLimit = request.UsageLimit,
            UsedCount = 0,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.Coupons.Add(coupon);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCoupon), new { id = coupon.Id }, coupon);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateCoupon(int id, UpdateCouponRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "Coupon data is required." });

        var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Id == id);
        if (coupon == null)
            return NotFound(new { message = "Coupon not found." });

        if (string.IsNullOrWhiteSpace(request.Code))
            return BadRequest(new { message = "Coupon code is required." });

        if (request.DiscountPercentage < 0 || request.DiscountPercentage > 100)
            return BadRequest(new { message = "Discount percentage must be between 0 and 100." });

        var duplicate = await _context.Coupons.AnyAsync(c => c.Id != id && c.Code.ToLower() == request.Code.Trim().ToLower());
        if (duplicate)
            return Conflict(new { message = "Another coupon already exists with this code." });

        coupon.Code = request.Code.Trim();
        coupon.Description = request.Description ?? string.Empty;
        coupon.DiscountPercentage = request.DiscountPercentage;
        coupon.MaximumDiscountAmount = request.MaximumDiscountAmount;
        coupon.MinimumOrderAmount = request.MinimumOrderAmount;
        coupon.UsageLimit = request.UsageLimit;
        coupon.StartDate = request.StartDate;
        coupon.EndDate = request.EndDate;
        coupon.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCoupon(int id)
    {
        var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Id == id);
        if (coupon == null)
            return NotFound(new { message = "Coupon not found." });

        _context.Coupons.Remove(coupon);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPatch("{id:int}/toggle")]
    public async Task<IActionResult> ToggleCoupon(int id)
    {
        var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Id == id);
        if (coupon == null)
            return NotFound(new { message = "Coupon not found." });

        coupon.IsActive = !coupon.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            coupon.Id,
            coupon.Code,
            coupon.IsActive,
            message = coupon.IsActive ? "Coupon activated." : "Coupon deactivated."
        });
    }

    public class CreateCouponRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal DiscountPercentage { get; set; }
        public decimal? MaximumDiscountAmount { get; set; }
        public decimal? MinimumOrderAmount { get; set; }
        public int UsageLimit { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdateCouponRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal DiscountPercentage { get; set; }
        public decimal? MaximumDiscountAmount { get; set; }
        public decimal? MinimumOrderAmount { get; set; }
        public int UsageLimit { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
