using System.Text.Json.Serialization;

namespace Safiyan.Core.Entities;

// One purchasable combination of a product's attributes (e.g. Color=Red, Size=M).
// Each variant has its own SKU, price and stock â€” Daraz-style.
public class ProductVariant
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public string SKU { get; set; } = string.Empty;

    public decimal Price { get; set; }
    public decimal DiscountPrice { get; set; }

    public int StockQuantity { get; set; }

    // Optional variant-specific image (e.g. show the red version of a shirt).
    // Falls back to the product's primary image when empty.
    public string ImageUrl { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    [JsonIgnore]
    public Product Product { get; set; } = null!;

    [JsonIgnore]
    public ICollection<ProductVariantAttributeValue> AttributeValues { get; set; } = new List<ProductVariantAttributeValue>();

    [JsonIgnore]
    public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
    [JsonIgnore]
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}