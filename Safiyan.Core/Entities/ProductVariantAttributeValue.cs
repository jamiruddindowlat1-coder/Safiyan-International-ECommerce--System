using System.Text.Json.Serialization;

namespace Safiyan.Core.Entities;

// Join table: which attribute-value combination makes up a given variant.
// e.g. VariantId=5 -> (Color, Red), (Size, M)
public class ProductVariantAttributeValue
{
    public int Id { get; set; }

    public int ProductVariantId { get; set; }
    public int ProductAttributeValueId { get; set; }

    [JsonIgnore]
    public ProductVariant ProductVariant { get; set; } = null!;

    [JsonIgnore]
    public ProductAttributeValue ProductAttributeValue { get; set; } = null!;
}