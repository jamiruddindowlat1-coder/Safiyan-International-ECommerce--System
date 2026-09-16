using System.Text.Json.Serialization;
using Safiyan.Core.Enums;

namespace Safiyan.Core.Entities;

/// <summary>
/// A settlement/payout batch to a vendor — mirrors Daraz Seller Center's
/// "settlement" concept. Created when Admin marks the vendor's pending
/// payable balance as paid. Does not touch individual OrderItems; those
/// are tracked separately via CommissionSettled for auditability.
/// </summary>
public class VendorPayout
{
    public int Id { get; set; }
    public int VendorId { get; set; }

    public string PayoutReference { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;

    public PayoutStatus Status { get; set; } = PayoutStatus.Pending;

    public DateTime PeriodFrom { get; set; }
    public DateTime PeriodTo { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }

    [JsonIgnore]
    public Vendor Vendor { get; set; } = null!;
}
