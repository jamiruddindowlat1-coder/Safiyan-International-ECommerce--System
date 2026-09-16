using System.Text.Json.Serialization;

namespace Safiyan.Core.Entities;

public class Category
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;

    // Daraz-style category commission percentage (e.g. 8.60 = 8.60%).
    // Applied to orders unless the selling vendor has a CommissionRateOverride.
    public decimal CommissionRate { get; set; } = 0m;

    // Self-referencing hierarchy: null ParentCategoryId = top-level category.
    // Supports unlimited nesting (Electronics -> Mobiles -> Smartphones -> ...).
    public int? ParentCategoryId { get; set; }

    [JsonIgnore]
    public Category? ParentCategory { get; set; }

    [JsonIgnore]
    public ICollection<Category> SubCategories { get; set; } = new List<Category>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    [JsonIgnore]
    public ICollection<Product> Products { get; set; } = new List<Product>();
}