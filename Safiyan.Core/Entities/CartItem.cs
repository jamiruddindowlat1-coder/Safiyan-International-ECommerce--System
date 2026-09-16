using System.Text.Json.Serialization;

namespace Safiyan.Core.Entities;

public class CartItem
{
    public int Id { get; set; }

    public int CartId { get; set; }
    public int ProductId { get; set; }

    // Null when the product has no variants (simple product).
    public int? ProductVariantId { get; set; }

    public int Quantity { get; set; } = 1;

    public decimal UnitPrice { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    [JsonIgnore]
    public Cart Cart { get; set; } = null!;
    [JsonIgnore]
    public Product Product { get; set; } = null!;
    [JsonIgnore]
    public ProductVariant? ProductVariant { get; set; }
}