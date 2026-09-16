namespace Safiyan.Core.DTOs;

// ---------- Category hierarchy ----------

public sealed record CreateCategoryDto(
    string Name,
    string Description,
    string ImageUrl,
    decimal CommissionRate,
    int? ParentCategoryId,
    bool IsActive = true);

public sealed record UpdateCategoryDto(
    int Id,
    string Name,
    string Description,
    string ImageUrl,
    decimal CommissionRate,
    int? ParentCategoryId,
    bool IsActive = true);

// Recursive tree node used to render nested categories (unlimited depth).
public sealed record CategoryTreeDto(
    int Id,
    string Name,
    string ImageUrl,
    decimal CommissionRate,
    bool IsActive,
    List<CategoryTreeDto> SubCategories);

// ---------- Product images ----------

public sealed record AddProductImageDto(
    string ImageUrl,
    bool IsPrimary = false,
    int DisplayOrder = 0);

public sealed record ReorderProductImagesDto(
    List<int> ImageIdsInOrder);

public sealed record ProductImageDto(
    int Id,
    int ProductId,
    string ImageUrl,
    bool IsPrimary,
    int DisplayOrder);

// ---------- Product attributes (Color, Size, etc.) ----------

public sealed record CreateProductAttributeDto(
    string Name);

public sealed record ProductAttributeDto(
    int Id,
    string Name,
    List<ProductAttributeValueDto> Values);

public sealed record CreateProductAttributeValueDto(
    int ProductAttributeId,
    string Value);

public sealed record ProductAttributeValueDto(
    int Id,
    int ProductAttributeId,
    string Value);

// ---------- Product variants ----------

// AttributeValueIds: e.g. [ id-of-Red, id-of-Medium ] to represent Color=Red, Size=M.
public sealed record CreateProductVariantDto(
    int ProductId,
    string SKU,
    decimal Price,
    decimal DiscountPrice,
    int StockQuantity,
    string ImageUrl,
    List<int> AttributeValueIds,
    bool IsActive = true);

public sealed record UpdateProductVariantDto(
    int Id,
    string SKU,
    decimal Price,
    decimal DiscountPrice,
    int StockQuantity,
    string ImageUrl,
    List<int> AttributeValueIds,
    bool IsActive = true);

public sealed record ProductVariantAttributeDto(
    string AttributeName,
    string Value);

public sealed record ProductVariantDto(
    int Id,
    int ProductId,
    string SKU,
    decimal Price,
    decimal DiscountPrice,
    int StockQuantity,
    string ImageUrl,
    bool IsActive,
    List<ProductVariantAttributeDto> Attributes);