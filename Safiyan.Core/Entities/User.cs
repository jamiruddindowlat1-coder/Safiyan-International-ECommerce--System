using System.Text.Json.Serialization;

namespace Safiyan.Core.Entities;

public class User
{
    public int Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Role { get; set; } = "Customer";

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    [JsonIgnore]
    public Vendor? Vendor { get; set; }

    [JsonIgnore]
    public ICollection<Order> Orders { get; set; } = new List<Order>();

    [JsonIgnore]
    public ICollection<Review> Reviews { get; set; } = new List<Review>();

    [JsonIgnore]
    public ICollection<Wishlist> Wishlists { get; set; } = new List<Wishlist>();

    [JsonIgnore]
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
