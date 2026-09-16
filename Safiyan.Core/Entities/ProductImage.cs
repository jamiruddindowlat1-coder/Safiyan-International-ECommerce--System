using System.Text.Json.Serialization;

namespace Safiyan.Core.Entities;

public class ProductImage
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public string ImageUrl { get; set; } = string.Empty;

    // Cover/thumbnail image shown in listings. Exactly one per product should be true.
    public bool IsPrimary { get; set; } = false;

    // Controls gallery order (0 = first).
    public int DisplayOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public Product Product { get; set; } = null!;
}