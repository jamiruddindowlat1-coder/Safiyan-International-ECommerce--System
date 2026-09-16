using System.Text.Json.Serialization;

namespace Safiyan.Core.Entities;

public class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public int VendorId { get; set; }

    // Null when the product has no variants (simple product).
    public int? ProductVariantId { get; set; }

    public string ProductName { get; set; } = string.Empty;
    public string ProductSKU { get; set; } = string.Empty;

    // Snapshot of the variant's attribute combination at purchase time
    // (e.g. "Color: Red, Size: M"), so the order stays readable even if
    // the variant is later edited or deleted.
    public string VariantDescription { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal TotalPrice { get; set; }

    // Commission snapshot â€” filled in when the order is marked Delivered.
    // Kept as a snapshot (not recalculated later) so historical orders
    // stay accurate even if category/vendor rates change afterward.
    public decimal CommissionRateApplied { get; set; } = 0m;
    public decimal CommissionAmount { get; set; } = 0m;
    public decimal VendorEarning { get; set; } = 0m;
    public bool CommissionSettled { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public Order Order { get; set; } = null!;
    [JsonIgnore]
    public Product Product { get; set; } = null!;
    [JsonIgnore]
    public ProductVariant? ProductVariant { get; set; }
    [JsonIgnore]
    public Vendor Vendor { get; set; } = null!;
}