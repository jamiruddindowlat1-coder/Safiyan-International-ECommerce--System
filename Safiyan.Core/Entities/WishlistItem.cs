using System.Text.Json.Serialization;

namespace Safiyan.Core.Entities;

public class WishlistItem
{
    public int Id { get; set; }

    public int WishlistId { get; set; }

    public int ProductId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public Wishlist Wishlist { get; set; } = null!;

    [JsonIgnore]
    public Product Product { get; set; } = null!;
}
