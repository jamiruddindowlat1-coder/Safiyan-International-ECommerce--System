namespace Safiyan.Core.DTOs;

public sealed record CreateProductDto(
    int CategoryId,
    int VendorId,
    string Name,
    string Description,
    string SKU,
    decimal Price,
    decimal DiscountPrice,
    int StockQuantity,
    string? ImageUrl = null,
    bool IsActive = true);

public sealed record UpdateProductDto(
    int Id,
    int CategoryId,
    int VendorId,
    string Name,
    string Description,
    string SKU,
    decimal Price,
    decimal DiscountPrice,
    int StockQuantity,
    string? ImageUrl = null,
    bool IsActive = true);

