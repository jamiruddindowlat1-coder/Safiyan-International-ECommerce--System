using System.Text.Json.Serialization;

namespace Safiyan.Core.Entities;

public class Product
{
    public int Id { get; set; }

    public int CategoryId { get; set; }
    public int VendorId { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;

    // Base price/stock â€” used directly for simple products with no variants.
    // If the product HAS variants, these act as a fallback/display default;
    // real price/stock for purchase comes from the selected ProductVariant.
    public decimal Price { get; set; }
    public decimal DiscountPrice { get; set; }
    public int StockQuantity { get; set; }

    // Legacy/cover image kept for backward compatibility.
    // New code should prefer the Images collection (first IsPrimary = true).
    public string ImageUrl { get; set; } = string.Empty;

    public bool HasVariants { get; set; } = false;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    [JsonIgnore]
    public Category Category { get; set; } = null!;
    [JsonIgnore]
    public Vendor Vendor { get; set; } = null!;

    [JsonIgnore]
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    [JsonIgnore]
    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();

    [JsonIgnore]
    public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
    [JsonIgnore]
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    [JsonIgnore]
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    [JsonIgnore]
    public ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();
}