using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Core.Enums;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentController : ControllerBase
{
	private readonly ApplicationDbContext _context;

	public PaymentController(ApplicationDbContext context)
	{
		_context = context;
	}

	[HttpGet("order/{orderId:int}")]
	public async Task<ActionResult<IEnumerable<object>>> GetOrderPayments(int orderId)
	{
		var payments = await _context.Payments
			.AsNoTracking()
			.Where(payment => payment.OrderId == orderId)
			.OrderByDescending(payment => payment.CreatedAt)
			.Select(payment => new
			{
				payment.Id,
				payment.OrderId,
				payment.TransactionId,
				payment.PaymentMethod,
				payment.Amount,
				payment.Status,
				payment.CreatedAt,
				payment.PaidAt
			})
			.ToListAsync();

		return Ok(payments);
	}

	[HttpPost]
	public async Task<ActionResult<object>> InitiatePayment(CreatePaymentRequest request)
	{
		if (request == null || request.OrderId <= 0)
			return BadRequest(new { message = "Valid OrderId is required." });

		if (string.IsNullOrWhiteSpace(request.PaymentMethod))
			return BadRequest(new { message = "Payment method is required." });

		var order = await _context.Orders.FirstOrDefaultAsync(item => item.Id == request.OrderId);
		if (order == null)
			return NotFound(new { message = "Order not found." });

		var payment = new Payment
		{
			OrderId = order.Id,
			PaymentMethod = request.PaymentMethod.Trim(),
			Amount = order.TotalAmount,
			TransactionId = $"PENDING-{Guid.NewGuid():N}"[..20],
			Status = PaymentStatus.Pending
		};

		_context.Payments.Add(payment);
		await _context.SaveChangesAsync();

		return CreatedAtAction(nameof(GetOrderPayments), new { orderId = order.Id }, payment);
	}

	public sealed class CreatePaymentRequest
	{
		public int OrderId { get; set; }
		public string PaymentMethod { get; set; } = string.Empty;
	}
}
