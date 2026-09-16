using System.Text.Json.Serialization;

namespace Safiyan.Core.Entities;

// A specific value for an attribute, e.g. Attribute "Color" -> Value "Red".
public class ProductAttributeValue
{
    public int Id { get; set; }

    public int ProductAttributeId { get; set; }

    public string Value { get; set; } = string.Empty;

    [JsonIgnore]
    public ProductAttribute ProductAttribute { get; set; } = null!;

    [JsonIgnore]
    public ICollection<ProductVariantAttributeValue> VariantLinks { get; set; } = new List<ProductVariantAttributeValue>();
}