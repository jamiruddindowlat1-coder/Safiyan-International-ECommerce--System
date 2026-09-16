using System.Text.Json.Serialization;

namespace Safiyan.Core.Entities;

public class Wishlist
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string Name { get; set; } = "My Wishlist";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    [JsonIgnore]
    public User User { get; set; } = null!;

    [JsonIgnore]
    public ICollection<WishlistItem> Items { get; set; } = new List<WishlistItem>();
}
