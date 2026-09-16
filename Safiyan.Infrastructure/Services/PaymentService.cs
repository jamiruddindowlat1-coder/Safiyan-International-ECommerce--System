using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Core.Interfaces;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Infrastructure.Services;

public sealed class PaymentService(ApplicationDbContext context) : IPaymentService
{
	public async Task<IReadOnlyList<Payment>> GetPaymentsForOrderAsync(int orderId, CancellationToken cancellationToken = default)
	{
		return await context.Payments
			.AsNoTracking()
			.Where(payment => payment.OrderId == orderId)
			.OrderByDescending(payment => payment.CreatedAt)
			.ToListAsync(cancellationToken);
	}

	public async Task<Payment> CreatePendingPaymentAsync(int orderId, string paymentMethod, CancellationToken cancellationToken = default)
	{
		var order = await context.Orders.FirstOrDefaultAsync(item => item.Id == orderId, cancellationToken)
			?? throw new InvalidOperationException("Order not found.");

		var payment = new Payment
		{
			OrderId = order.Id,
			PaymentMethod = paymentMethod,
			Amount = order.TotalAmount,
			TransactionId = $"PENDING-{Guid.NewGuid():N}"[..20]
		};

		context.Payments.Add(payment);
		await context.SaveChangesAsync(cancellationToken);
		return payment;
	}
}
