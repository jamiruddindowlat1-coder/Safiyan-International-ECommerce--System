using System.Text.Json.Serialization;

namespace Safiyan.Core.Entities;

public class Vendor
{
    public int Id { get; set; }
    public int UserId { get; set; }

    public string StoreName { get; set; } = string.Empty;
    public string StoreDescription { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;

    public bool IsApproved { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    [JsonIgnore]
    public User User { get; set; } = null!;

    [JsonIgnore]
    public ICollection<Product> Products { get; set; } = new List<Product>();
    [JsonIgnore]
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
