using System.Text.Json.Serialization;
using Safiyan.Core.Enums;

namespace Safiyan.Core.Entities;

public class Order
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string OrderNumber { get; set; } = string.Empty;

    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal ShippingAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }

    public string ShippingName { get; set; } = string.Empty;
    public string ShippingPhone { get; set; } = string.Empty;
    public string ShippingAddress { get; set; } = string.Empty;
    public string ShippingCity { get; set; } = string.Empty;
    public string ShippingPostalCode { get; set; } = string.Empty;
    public string ShippingCountry { get; set; } = string.Empty;

    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    [JsonIgnore]
    public User User { get; set; } = null!;

    [JsonIgnore]
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();

    [JsonIgnore]
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
