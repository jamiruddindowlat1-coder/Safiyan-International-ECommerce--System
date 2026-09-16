using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.DTOs;
using Safiyan.Core.Entities;
using Safiyan.Core.Enums;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PayoutController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PayoutController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Payout?vendorId=&status=
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<object>>> GetPayouts(int? vendorId, PayoutStatus? status)
    {
        var query = _context.VendorPayouts
            .AsNoTracking()
            .Include(p => p.Vendor)
            .AsQueryable();

        if (vendorId.HasValue)
            query = query.Where(p => p.VendorId == vendorId.Value);

        if (status.HasValue)
            query = query.Where(p => p.Status == status.Value);

        var payouts = await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.VendorId,
                VendorStoreName = p.Vendor.StoreName,
                p.PayoutReference,
                p.Amount,
                p.PaymentMethod,
                p.Notes,
                p.Status,
                p.PeriodFrom,
                p.PeriodTo,
                p.CreatedAt,
                p.PaidAt
            })
            .ToListAsync();

        return Ok(payouts);
    }

    // GET: api/Payout/vendor/5
    [HttpGet("vendor/{vendorId:int}")]
    [Authorize(Roles = "Vendor,Admin")]
    public async Task<ActionResult<IEnumerable<object>>> GetPayoutsForVendor(int vendorId)
    {
        var vendorExists = await _context.Vendors.AnyAsync(v => v.Id == vendorId);
        if (!vendorExists)
            return NotFound(new { message = "Vendor not found." });

        var payouts = await _context.VendorPayouts
            .AsNoTracking()
            .Where(p => p.VendorId == vendorId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.PayoutReference,
                p.Amount,
                p.PaymentMethod,
                p.Status,
                p.PeriodFrom,
                p.PeriodTo,
                p.CreatedAt,
                p.PaidAt
            })
            .ToListAsync();

        return Ok(payouts);
    }

    // POST: api/Payout
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> CreatePayout(CreatePayoutDto request)
    {
        if (request == null)
            return BadRequest(new { message = "Payout data is required." });

        if (request.Amount <= 0)
            return BadRequest(new { message = "Amount must be greater than zero." });

        if (string.IsNullOrWhiteSpace(request.PaymentMethod))
            return BadRequest(new { message = "Payment method is required." });

        var vendor = await _context.Vendors.FirstOrDefaultAsync(v => v.Id == request.VendorId);
        if (vendor == null)
            return NotFound(new { message = "Vendor not found." });

        if (request.Amount > vendor.PayableBalance)
        {
            return BadRequest(new
            {
                message = $"Amount exceeds the vendor's payable balance of {vendor.PayableBalance:0.00}.",
                payableBalance = vendor.PayableBalance
            });
        }

        var payout = new VendorPayout
        {
            VendorId = vendor.Id,
            PayoutReference = $"PO-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper()}",
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod.Trim(),
            Notes = request.Notes != null ? request.Notes.Trim() : string.Empty,
            Status = PayoutStatus.Paid,
            PeriodFrom = request.PeriodFrom,
            PeriodTo = request.PeriodTo,
            CreatedAt = DateTime.UtcNow,
            PaidAt = DateTime.UtcNow
        };

        _context.VendorPayouts.Add(payout);

        vendor.PayableBalance -= request.Amount;
        vendor.UpdatedAt = DateTime.UtcNow;

        _context.AccountEntries.Add(new AccountEntry
        {
            EntryDate = DateTime.UtcNow.Date,
            Type = "Expense",
            Description = "Vendor payout - " + vendor.StoreName,
            Amount = request.Amount,
            Reference = payout.PayoutReference,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new
        {
            payout.Id,
            payout.PayoutReference,
            payout.Amount,
            payout.Status,
            vendor.PayableBalance,
            message = "Payout processed successfully."
        });
    }
}
