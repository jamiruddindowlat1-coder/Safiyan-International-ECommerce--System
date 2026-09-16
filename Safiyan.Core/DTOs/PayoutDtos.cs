namespace Safiyan.Core.DTOs;

public sealed record CreatePayoutDto(
    int VendorId,
    decimal Amount,
    string PaymentMethod,
    DateTime PeriodFrom,
    DateTime PeriodTo,
    string? Notes = null);
