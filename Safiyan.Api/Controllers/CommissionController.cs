using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Core.Enums;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Api.Controllers;

/// <summary>
/// Marketplace commission and vendor settlement endpoints — the
/// Daraz Seller Center equivalent of "My Income" for vendors and
/// "Commission / Settlement" for admins.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CommissionController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CommissionController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Commission/vendor/5/summary
    // Vendor's own earnings summary — total sold, commission deducted,
    // net earning, current payable balance, and payout history.
    [HttpGet("vendor/{vendorId:int}/summary")]
    [Authorize(Roles = "Vendor,Admin")]
    public async Task<ActionResult<object>> GetVendorSummary(int vendorId, DateTime? from, DateTime? to)
    {
        var vendor = await _context.Vendors
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == vendorId);

        if (vendor == null)
            return NotFound(new { message = "Vendor not found." });

        var startDate = (from ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1)).Date;
        var endDate = (to ?? DateTime.UtcNow).Date;
        var endExclusive = endDate.AddDays(1);

        var settledItems = await _context.OrderItems
            .AsNoTracking()
            .Where(i => i.VendorId == vendorId
                && i.CommissionSettled
                && i.CreatedAt >= startDate
                && i.CreatedAt < endExclusive)
            .Select(i => new
            {
                i.TotalPrice,
                i.CommissionRateApplied,
                i.CommissionAmount,
                i.VendorEarning
            })
            .ToListAsync();

        var totalSales = settledItems.Sum(i => i.TotalPrice);
        var totalCommission = settledItems.Sum(i => i.CommissionAmount);
        var totalEarning = settledItems.Sum(i => i.VendorEarning);

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

        return Ok(new
        {
            VendorId = vendor.Id,
            vendor.StoreName,
            EffectiveCommissionRate = vendor.CommissionRateOverride,
            From = startDate,
            To = endDate,
            TotalSales = totalSales,
            TotalCommission = totalCommission,
            TotalEarning = totalEarning,
            CurrentPayableBalance = vendor.PayableBalance,
            Payouts = payouts
        });
    }

    // GET: api/Commission/admin/summary
    // Admin-wide commission report across all vendors for a period —
    // equivalent of Daraz's marketplace commission dashboard.
    [HttpGet("admin/summary")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> GetAdminSummary(DateTime? from, DateTime? to)
    {
        var startDate = (from ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1)).Date;
        var endDate = (to ?? DateTime.UtcNow).Date;
        var endExclusive = endDate.AddDays(1);

        var settledItems = await _context.OrderItems
            .AsNoTracking()
            .Include(i => i.Vendor)
            .Where(i => i.CommissionSettled
                && i.CreatedAt >= startDate
                && i.CreatedAt < endExclusive)
            .ToListAsync();

        var byVendor = settledItems
            .GroupBy(i => new { i.VendorId, StoreName = i.Vendor.StoreName })
            .Select(g => new
            {
                g.Key.VendorId,
                g.Key.StoreName,
                TotalSales = g.Sum(i => i.TotalPrice),
                TotalCommission = g.Sum(i => i.CommissionAmount),
                TotalEarning = g.Sum(i => i.VendorEarning)
            })
            .OrderByDescending(v => v.TotalCommission)
            .ToList();

        var currentPayables = await _context.Vendors
            .AsNoTracking()
            .Where(v => v.PayableBalance > 0)
            .Select(v => new { v.Id, v.StoreName, v.PayableBalance })
            .OrderByDescending(v => v.PayableBalance)
            .ToListAsync();

        return Ok(new
        {
            From = startDate,
            To = endDate,
            TotalMarketplaceSales = settledItems.Sum(i => i.TotalPrice),
            TotalCommissionEarned = settledItems.Sum(i => i.CommissionAmount),
            TotalVendorEarnings = settledItems.Sum(i => i.VendorEarning),
            ByVendor = byVendor,
            OutstandingPayables = currentPayables
        });
    }

    // POST: api/Commission/payouts
    // Admin marks a vendor's current payable balance as paid out —
    // creates a settlement record and resets (or partially reduces)
    // the running payable balance. Mirrors Daraz's settlement cycle.
    [HttpPost("payouts")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> CreatePayout(CreatePayoutRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "Payout data is required." });

        var vendor = await _context.Vendors.FirstOrDefaultAsync(v => v.Id == request.VendorId);
        if (vendor == null)
            return NotFound(new { message = "Vendor not found." });

        if (request.Amount <= 0)
            return BadRequest(new { message = "Amount must be greater than zero." });

        if (request.Amount > vendor.PayableBalance)
            return BadRequest(new
            {
                message = $"Amount exceeds vendor's payable balance of {vendor.PayableBalance:0.00}."
            });

        var payout = new VendorPayout
        {
            VendorId = vendor.Id,
            PayoutReference = $"PO-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod?.Trim() ?? string.Empty,
            Notes = request.Notes?.Trim() ?? string.Empty,
            Status = PayoutStatus.Paid,
            PeriodFrom = request.PeriodFrom?.Date ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1),
            PeriodTo = request.PeriodTo?.Date ?? DateTime.UtcNow.Date,
            CreatedAt = DateTime.UtcNow,
            PaidAt = DateTime.UtcNow
        };

        vendor.PayableBalance -= request.Amount;
        vendor.UpdatedAt = DateTime.UtcNow;

        _context.VendorPayouts.Add(payout);

        // Payout is a cash outflow — recorded as an Expense so it's
        // reflected in the same accounting ledger as commission income.
        _context.AccountEntries.Add(new AccountEntry
        {
            EntryDate = DateTime.UtcNow.Date,
            Type = "Expense",
            Description = $"Vendor payout — {vendor.StoreName} ({payout.PayoutReference})",
            Amount = request.Amount,
            Reference = payout.PayoutReference,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetVendorSummary), new { vendorId = vendor.Id }, new
        {
            payout.Id,
            payout.PayoutReference,
            payout.Amount,
            payout.Status,
            RemainingPayableBalance = vendor.PayableBalance,
            message = "Vendor payout recorded successfully."
        });
    }

    // GET: api/Commission/payouts?vendorId=5
    [HttpGet("payouts")]
    [Authorize(Roles = "Admin,Vendor")]
    public async Task<ActionResult<IEnumerable<object>>> GetPayouts(int? vendorId)
    {
        var query = _context.VendorPayouts.AsNoTracking().Include(p => p.Vendor).AsQueryable();

        if (vendorId.HasValue)
            query = query.Where(p => p.VendorId == vendorId.Value);

        var payouts = await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.VendorId,
                StoreName = p.Vendor.StoreName,
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

    public class CreatePayoutRequest
    {
        public int VendorId { get; set; }
        public decimal Amount { get; set; }
        public string? PaymentMethod { get; set; }
        public string? Notes { get; set; }
        public DateTime? PeriodFrom { get; set; }
        public DateTime? PeriodTo { get; set; }
    }
}
