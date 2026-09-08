using System.Text.Json.Serialization;

namespace Safiyan.Core.Entities;

public class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public int VendorId { get; set; }

    public string ProductName { get; set; } = string.Empty;
    public string ProductSKU { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal TotalPrice { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public Order Order { get; set; } = null!;
    [JsonIgnore]
    public Product Product { get; set; } = null!;
    [JsonIgnore]
    public Vendor Vendor { get; set; } = null!;
}
