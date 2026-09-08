namespace Safiyan.Core.DTOs;

public sealed record AccountEntryDto(
    DateTime? EntryDate,
    string Type,
    string Description,
    decimal Amount,
    string? Reference = null);

public sealed record UpdateOrderStatusDto(string Status);

public sealed record CreateVendorDto(
    int UserId,
    string StoreName,
    string? StoreDescription = null,
    string? Phone = null,
    string? Address = null);
