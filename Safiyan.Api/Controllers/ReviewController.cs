using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Core.Enums;
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

    // ============================================================
    // GET REVIEWS FOR A PRODUCT (public — no auth required)
    // GET /api/Review/product/{productId}
    // ============================================================

    [HttpGet("product/{productId:int}")]
    public async Task<ActionResult<object>> GetProductReviews(int productId)
    {
        var reviews = await _context.Reviews
            .AsNoTracking()
            .Include(r => r.User)
            .Where(r => r.ProductId == productId && r.IsApproved)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.Rating,
                r.Comment,
                r.CreatedAt,
                r.UpdatedAt,
                CustomerName = r.User.FullName
            })
            .ToListAsync();

        var averageRating = reviews.Count > 0
            ? Math.Round(reviews.Average(r => r.Rating), 1)
            : 0;

        return Ok(new
        {
            averageRating,
            totalReviews = reviews.Count,
            reviews
        });
    }

    // ============================================================
    // GET REVIEWS BY A USER
    // GET /api/Review/user/{userId}
    // ============================================================

    [Authorize]
    [HttpGet("user/{userId:int}")]
    public async Task<ActionResult<IEnumerable<object>>> GetUserReviews(int userId)
    {
        var reviews = await _context.Reviews
            .AsNoTracking()
            .Include(r => r.Product)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.ProductId,
                ProductName = r.Product.Name,
                r.Rating,
                r.Comment,
                r.IsApproved,
                r.CreatedAt
            })
            .ToListAsync();

        return Ok(reviews);
    }

    // ============================================================
    // CREATE REVIEW
    // POST /api/Review
    //
    // Rule: a user may only review a product they have actually
    // received (Order.Status == Delivered), and only once per product.
    // ============================================================

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<object>> CreateReview(CreateReviewRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "Review data is required." });

        if (request.Rating < 1 || request.Rating > 5)
            return BadRequest(new { message = "Rating must be between 1 and 5." });

        var alreadyReviewed = await _context.Reviews
            .AnyAsync(r =>
                r.ProductId == request.ProductId &&
                r.UserId == request.UserId);

        if (alreadyReviewed)
            return BadRequest(new { message = "You have already reviewed this product." });

        var hasDeliveredOrder = await _context.Orders
            .Where(o => o.UserId == request.UserId && o.Status == OrderStatus.Delivered)
            .SelectMany(o => o.Items)
            .AnyAsync(i => i.ProductId == request.ProductId);

        if (!hasDeliveredOrder)
        {
            return BadRequest(new
            {
                message = "You can only review products from a delivered order."
            });
        }

        var review = new Review
        {
            ProductId = request.ProductId,
            UserId = request.UserId,
            Rating = request.Rating,
            Comment = request.Comment ?? string.Empty,
            IsApproved = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetProductReviews),
            new { productId = review.ProductId },
            new
            {
                review.Id,
                review.ProductId,
                review.Rating,
                review.Comment,
                review.CreatedAt
            });
    }

    // ============================================================
    // UPDATE REVIEW
    // PUT /api/Review/{id}
    // ============================================================

    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<object>> UpdateReview(int id, UpdateReviewRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "Review data is required." });

        if (request.Rating < 1 || request.Rating > 5)
            return BadRequest(new { message = "Rating must be between 1 and 5." });

        var review = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == id);

        if (review == null)
            return NotFound(new { message = "Review not found." });

        review.Rating = request.Rating;
        review.Comment = request.Comment ?? string.Empty;
        review.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            review.Id,
            review.Rating,
            review.Comment,
            review.UpdatedAt
        });
    }

    // ============================================================
    // DELETE REVIEW
    // DELETE /api/Review/{id}
    // ============================================================

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteReview(int id)
    {
        var review = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == id);

        if (review == null)
            return NotFound(new { message = "Review not found." });

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Review deleted successfully." });
    }

    // ============================================================
    // ADMIN: TOGGLE APPROVAL
    // PATCH /api/Review/{id}/approve
    // ============================================================

    [Authorize]
    [HttpPatch("{id:int}/approve")]
    public async Task<ActionResult<object>> ToggleApproval(int id)
    {
        var review = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == id);

        if (review == null)
            return NotFound(new { message = "Review not found." });

        review.IsApproved = !review.IsApproved;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            review.Id,
            review.IsApproved,
            message = "Review approval status updated."
        });
    }

    // ============================================================
    // REQUEST MODELS
    // ============================================================

    public class CreateReviewRequest
    {
        public int ProductId { get; set; }
        public int UserId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }

    public class UpdateReviewRequest
    {
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}
