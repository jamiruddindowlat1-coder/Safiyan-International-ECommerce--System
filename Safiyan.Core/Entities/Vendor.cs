using System.Text.Json.Serialization;

namespace Safiyan.Core.Entities;

public class Vendor
{
    public int Id { get; set; }
    public int UserId { get; set; }

    public string StoreName { get; set; } = string.Empty;
    public string StoreDescription { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? StoreLogoUrl { get; set; }
    public string? StoreBannerUrl { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;

    public bool IsApproved { get; set; } = false;

    // Daraz-style: category commission rate applies by default.
    // If set (non-null), this overrides the category rate for every
    // product this vendor sells - mirrors Seller Center's negotiated rates.
    public decimal? CommissionRateOverride { get; set; }

    // Running ledger balance owed to the vendor after commission deduction.
    // Increased when an order is Delivered, reduced when a payout is marked Paid.
    public decimal PayableBalance { get; set; } = 0m;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    [JsonIgnore]
    public User User { get; set; } = null!;

    [JsonIgnore]
    public ICollection<Product> Products { get; set; } = new List<Product>();
    [JsonIgnore]
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    [JsonIgnore]
    public ICollection<VendorPayout> Payouts { get; set; } = new List<VendorPayout>();
}
