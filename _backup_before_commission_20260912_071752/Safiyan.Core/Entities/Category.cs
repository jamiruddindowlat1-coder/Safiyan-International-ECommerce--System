using System.Text.Json.Serialization;

namespace Safiyan.Core.Entities;

public class Category
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    [JsonIgnore]
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
