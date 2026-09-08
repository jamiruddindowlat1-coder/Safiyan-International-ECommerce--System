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

    public decimal Price { get; set; }
    public decimal DiscountPrice { get; set; }

    public int StockQuantity { get; set; }

    public string ImageUrl { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    [JsonIgnore]
    public Category Category { get; set; } = null!;
    [JsonIgnore]
    public Vendor Vendor { get; set; } = null!;

    [JsonIgnore]
    public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
    [JsonIgnore]
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    [JsonIgnore]
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    [JsonIgnore]
    public ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();
}
