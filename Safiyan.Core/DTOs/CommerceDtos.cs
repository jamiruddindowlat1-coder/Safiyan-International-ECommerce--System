namespace Safiyan.Core.DTOs;

public sealed record AddCartItemDto(int UserId, int ProductId, int Quantity = 1);

public sealed record UpdateCartItemDto(int Quantity);

public sealed record CreateOrderDto(
    int UserId,
    string ShippingName,
    string ShippingPhone,
    string ShippingAddress,
    string ShippingCity,
    string ShippingPostalCode,
    string ShippingCountry,
    decimal? ShippingAmount = null,
    decimal? TaxAmount = null);

public sealed record CreatePaymentDto(int OrderId, string PaymentMethod);

public sealed record CreateReviewDto(int ProductId, int UserId, int Rating, string Comment);

public sealed record ShippingQuoteDto(string? Country, decimal WeightKg);
