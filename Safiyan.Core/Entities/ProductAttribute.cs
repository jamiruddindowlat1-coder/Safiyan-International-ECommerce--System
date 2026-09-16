using System.Text.Json.Serialization;

namespace Safiyan.Core.Entities;

// Defines a variant dimension, e.g. "Color", "Size", "Storage".
public class ProductAttribute
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ICollection<ProductAttributeValue> Values { get; set; } = new List<ProductAttributeValue>();
}