using Safiyan.Core.Entities;

namespace Safiyan.Core.Interfaces;

public interface IPaymentService
{
	Task<IReadOnlyList<Payment>> GetPaymentsForOrderAsync(int orderId, CancellationToken cancellationToken = default);
	Task<Payment> CreatePendingPaymentAsync(int orderId, string paymentMethod, CancellationToken cancellationToken = default);
}
