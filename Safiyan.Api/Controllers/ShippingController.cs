using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShippingController : ControllerBase
{
	private readonly ApplicationDbContext _context;

	public ShippingController(ApplicationDbContext context)
	{
		_context = context;
	}

	[HttpPost("quote")]
	public ActionResult<object> GetQuote(ShippingQuoteRequest request)
	{
		if (request == null || request.WeightKg <= 0)
			return BadRequest(new { message = "WeightKg must be greater than zero." });

		var baseRate = request.Country?.Trim().Equals("Bangladesh", StringComparison.OrdinalIgnoreCase) == true ? 80m : 450m;
		var amount = baseRate + Math.Max(0, request.WeightKg - 1) * 35m;

		return Ok(new
		{
			Country = request.Country?.Trim() ?? "Bangladesh",
			request.WeightKg,
			ShippingAmount = amount,
			EstimatedDays = baseRate == 80m ? "2-5 business days" : "5-12 business days"
		});
	}

	[HttpGet("track/{orderId:int}")]
	public async Task<ActionResult<object>> TrackOrder(int orderId)
	{
		var order = await _context.Orders
			.AsNoTracking()
			.Where(item => item.Id == orderId)
			.Select(item => new
			{
				item.Id,
				item.OrderNumber,
				item.Status,
				item.ShippingName,
				item.ShippingAddress,
				item.UpdatedAt,
				item.CreatedAt
			})
			.FirstOrDefaultAsync();

		return order == null
			? NotFound(new { message = "Order not found." })
			: Ok(order);
	}

	public sealed class ShippingQuoteRequest
	{
		public string? Country { get; set; }
		public decimal WeightKg { get; set; }
	}
}
