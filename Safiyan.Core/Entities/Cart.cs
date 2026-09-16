using System.Text.Json.Serialization;

namespace Safiyan.Core.Entities;

public class Cart
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    [JsonIgnore]
    public User User { get; set; } = null!;

    [JsonIgnore]
    public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
}
