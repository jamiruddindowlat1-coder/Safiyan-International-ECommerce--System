using System.Text.Json.Serialization;
using Safiyan.Core.Enums;

namespace Safiyan.Core.Entities;

public class Payment
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public string TransactionId { get; set; } = string.Empty;

    public string PaymentMethod { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    public string GatewayResponse { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? PaidAt { get; set; }

    [JsonIgnore]
    public Order Order { get; set; } = null!;
}
