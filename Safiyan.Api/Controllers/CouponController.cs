using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CouponController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CouponController(ApplicationDbContext context)
    {
        _context = context;
    }

    // ============================================================
    // GET ALL COUPONS
    // GET /api/Coupon
    // ============================================================

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

    // ============================================================
    // GET SINGLE COUPON
    // GET /api/Coupon/{id}
    // ============================================================

    [HttpGet("{id:int}")]
    public async Task<ActionResult<object>> GetCoupon(int id)
    {
        var coupon = await _context.Coupons
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (coupon == null)
            return NotFound(new { message = "Coupon not found." });

        return Ok(coupon);
    }

    // ============================================================
    // CREATE COUPON
    // POST /api/Coupon
    // ============================================================

    [HttpPost]
    public async Task<ActionResult<object>> CreateCoupon(
        CouponRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Code))
            return BadRequest(new { message = "Coupon code is required." });

        var code = request.Code.Trim();

        var exists = await _context.Coupons
            .AnyAsync(c => c.Code.ToLower() == code.ToLower());

        if (exists)
            return BadRequest(new { message = "A coupon with this code already exists." });

        var coupon = new Coupon
        {
            Code = code,
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

        return CreatedAtAction(
            nameof(GetCoupon),
            new { id = coupon.Id },
            coupon);
    }

    // ============================================================
    // UPDATE COUPON
    // PUT /api/Coupon/{id}
    // ============================================================

    [HttpPut("{id:int}")]
    public async Task<ActionResult<object>> UpdateCoupon(
        int id,
        CouponRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Code))
            return BadRequest(new { message = "Coupon code is required." });

        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Id == id);

        if (coupon == null)
            return NotFound(new { message = "Coupon not found." });

        var code = request.Code.Trim();

        var duplicate = await _context.Coupons
            .AnyAsync(c => c.Id != id && c.Code.ToLower() == code.ToLower());

        if (duplicate)
            return BadRequest(new { message = "A coupon with this code already exists." });

        coupon.Code = code;
        coupon.Description = request.Description ?? string.Empty;
        coupon.DiscountPercentage = request.DiscountPercentage;
        coupon.MaximumDiscountAmount = request.MaximumDiscountAmount;
        coupon.MinimumOrderAmount = request.MinimumOrderAmount;
        coupon.UsageLimit = request.UsageLimit;
        coupon.StartDate = request.StartDate;
        coupon.EndDate = request.EndDate;
        coupon.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return Ok(coupon);
    }

    // ============================================================
    // DELETE COUPON
    // DELETE /api/Coupon/{id}
    // ============================================================

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCoupon(int id)
    {
        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Id == id);

        if (coupon == null)
            return NotFound(new { message = "Coupon not found." });

        _context.Coupons.Remove(coupon);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Coupon deleted successfully." });
    }

    // ============================================================
    // TOGGLE ACTIVE STATUS
    // PATCH /api/Coupon/{id}/toggle
    // ============================================================

    [HttpPatch("{id:int}/toggle")]
    public async Task<ActionResult<object>> ToggleCoupon(int id)
    {
        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Id == id);

        if (coupon == null)
            return NotFound(new { message = "Coupon not found." });

        coupon.IsActive = !coupon.IsActive;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            coupon.Id,
            coupon.IsActive,
            message = "Coupon status updated."
        });
    }

    // ============================================================
    // VALIDATE COUPON
    // POST /api/Coupon/validate
    // Body: { couponCode, subTotal }
    //
    // Same rules as OrderController.CreateOrder's coupon check,
    // but does NOT consume the coupon (UsedCount is untouched).
    // Used by the Checkout page "Apply" button to preview the
    // discount before the order is actually placed.
    // ============================================================

    [HttpPost("validate")]
    public async Task<ActionResult<object>> ValidateCoupon(
        ValidateCouponRequest request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.CouponCode))
        {
            return BadRequest(new
            {
                valid = false,
                message = "Coupon code is required."
            });
        }

        var subTotal = request.SubTotal ?? 0m;
        var code = request.CouponCode.Trim();

        var coupon = await _context.Coupons
            .AsNoTracking()
            .FirstOrDefaultAsync(c =>
                c.Code.ToLower() == code.ToLower());

        if (coupon == null)
        {
            return Ok(new
            {
                valid = false,
                message = "Coupon code not found."
            });
        }

        if (!coupon.IsActive)
        {
            return Ok(new
            {
                valid = false,
                message = "This coupon is no longer active."
            });
        }

        var now = DateTime.UtcNow;

        if (now < coupon.StartDate)
        {
            return Ok(new
            {
                valid = false,
                message = "This coupon is not active yet."
            });
        }

        if (now > coupon.EndDate)
        {
            return Ok(new
            {
                valid = false,
                message = "This coupon has expired."
            });
        }

        if (coupon.UsageLimit > 0 &&
            coupon.UsedCount >= coupon.UsageLimit)
        {
            return Ok(new
            {
                valid = false,
                message = "This coupon has reached its usage limit."
            });
        }

        if (coupon.MinimumOrderAmount.HasValue &&
            subTotal < coupon.MinimumOrderAmount.Value)
        {
            return Ok(new
            {
                valid = false,
                message =
                    $"This coupon requires a minimum order of ৳{coupon.MinimumOrderAmount.Value}."
            });
        }

        var rawDiscount = Math.Round(
            subTotal * (coupon.DiscountPercentage / 100m),
            2);

        var discountAmount = coupon.MaximumDiscountAmount.HasValue
            ? Math.Min(rawDiscount, coupon.MaximumDiscountAmount.Value)
            : rawDiscount;

        return Ok(new
        {
            valid = true,
            code = coupon.Code,
            description = coupon.Description,
            discountPercentage = coupon.DiscountPercentage,
            discountAmount,
            newTotal = Math.Max(subTotal - discountAmount, 0m),
            message = "Coupon applied successfully."
        });
    }

    // ============================================================
    // REQUEST MODELS
    // ============================================================

    public class ValidateCouponRequest
    {
        public string CouponCode { get; set; } = string.Empty;

        public decimal? SubTotal { get; set; }
    }

    public class CouponRequest
    {
        public string Code { get; set; } = string.Empty;

        public string? Description { get; set; }

        public decimal DiscountPercentage { get; set; }

        public decimal? MaximumDiscountAmount { get; set; }

        public decimal? MinimumOrderAmount { get; set; }

        public int UsageLimit { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
