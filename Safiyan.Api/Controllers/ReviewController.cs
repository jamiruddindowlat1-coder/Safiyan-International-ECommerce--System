using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewController : ControllerBase
{
	private readonly ApplicationDbContext _context;

	public ReviewController(ApplicationDbContext context)
	{
		_context = context;
	}

	[HttpGet("product/{productId:int}")]
	public async Task<ActionResult<IEnumerable<object>>> GetProductReviews(int productId)
	{
		var reviews = await _context.Reviews
			.AsNoTracking()
			.Include(review => review.User)
			.Where(review => review.ProductId == productId && review.IsApproved)
			.OrderByDescending(review => review.CreatedAt)
			.Select(review => new
			{
				review.Id,
				review.ProductId,
				review.UserId,
				UserName = review.User.FullName,
				review.Rating,
				review.Comment,
				review.CreatedAt
			})
			.ToListAsync();

		return Ok(reviews);
	}

	[HttpPost]
	public async Task<ActionResult<Review>> CreateReview(CreateReviewRequest request)
	{
		if (request == null || request.ProductId <= 0 || request.UserId <= 0)
			return BadRequest(new { message = "Valid product and user IDs are required." });

		if (request.Rating is < 1 or > 5)
			return BadRequest(new { message = "Rating must be between 1 and 5." });

		if (string.IsNullOrWhiteSpace(request.Comment))
			return BadRequest(new { message = "Comment is required." });

		var productExists = await _context.Products.AnyAsync(product => product.Id == request.ProductId);
		var userExists = await _context.Users.AnyAsync(user => user.Id == request.UserId);
		if (!productExists || !userExists)
			return NotFound(new { message = "Product or user not found." });

		var review = new Review
		{
			ProductId = request.ProductId,
			UserId = request.UserId,
			Rating = request.Rating,
			Comment = request.Comment.Trim()
		};

		_context.Reviews.Add(review);
		await _context.SaveChangesAsync();
		return Ok(review);
	}

	[HttpDelete("{id:int}")]
	public async Task<IActionResult> DeleteReview(int id)
	{
		var review = await _context.Reviews.FindAsync(id);
		if (review == null)
			return NotFound(new { message = "Review not found." });

		_context.Reviews.Remove(review);
		await _context.SaveChangesAsync();
		return NoContent();
	}

	public sealed class CreateReviewRequest
	{
		public int ProductId { get; set; }
		public int UserId { get; set; }
		public int Rating { get; set; }
		public string Comment { get; set; } = string.Empty;
	}
}
