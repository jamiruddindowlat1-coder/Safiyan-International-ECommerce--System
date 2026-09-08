using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WishlistController : ControllerBase
{
	private readonly ApplicationDbContext _context;

	public WishlistController(ApplicationDbContext context)
	{
		_context = context;
	}

	[HttpGet("user/{userId:int}")]
	public async Task<ActionResult<IEnumerable<object>>> GetByUser(int userId)
	{
		var items = await _context.WishlistItems
			.AsNoTracking()
			.Include(item => item.Product)
			.Where(item => item.Wishlist.UserId == userId)
			.OrderByDescending(item => item.CreatedAt)
			.Select(item => new
			{
				item.Id,
				item.ProductId,
				ProductName = item.Product.Name,
				ProductImage = item.Product.ImageUrl,
				item.Product.Price,
				item.Product.DiscountPrice,
				item.CreatedAt
			})
			.ToListAsync();

		return Ok(items);
	}

	[HttpPost("items")]
	public async Task<ActionResult<object>> AddItem(AddWishlistItemRequest request)
	{
		if (request.UserId <= 0 || request.ProductId <= 0)
			return BadRequest(new { message = "Valid user and product IDs are required." });

		var productExists = await _context.Products
			.AnyAsync(product => product.Id == request.ProductId && product.IsActive);

		if (!productExists)
			return NotFound(new { message = "Product not found or inactive." });

		var wishlist = await _context.Wishlists
			.Include(item => item.Items)
			.FirstOrDefaultAsync(item => item.UserId == request.UserId);

		if (wishlist == null)
		{
			var userExists = await _context.Users.AnyAsync(user => user.Id == request.UserId);
			if (!userExists)
				return NotFound(new { message = "User not found." });

			wishlist = new Wishlist { UserId = request.UserId };
			_context.Wishlists.Add(wishlist);
		}

		if (wishlist.Items.Any(item => item.ProductId == request.ProductId))
			return Conflict(new { message = "Product is already in the wishlist." });

		var wishlistItem = new WishlistItem { ProductId = request.ProductId };
		wishlist.Items.Add(wishlistItem);
		wishlist.UpdatedAt = DateTime.UtcNow;
		await _context.SaveChangesAsync();

		return Ok(new { wishlistItem.Id, wishlistItem.ProductId, wishlistItem.CreatedAt });
	}

	[HttpDelete("items/{itemId:int}")]
	public async Task<IActionResult> RemoveItem(int itemId)
	{
		var item = await _context.WishlistItems.FindAsync(itemId);
		if (item == null)
			return NotFound(new { message = "Wishlist item not found." });

		_context.WishlistItems.Remove(item);
		await _context.SaveChangesAsync();
		return NoContent();
	}

	[HttpDelete("user/{userId:int}")]
	public async Task<IActionResult> Clear(int userId)
	{
		var items = await _context.WishlistItems
			.Where(item => item.Wishlist.UserId == userId)
			.ToListAsync();

		_context.WishlistItems.RemoveRange(items);
		await _context.SaveChangesAsync();
		return NoContent();
	}

	public sealed class AddWishlistItemRequest
	{
		public int UserId { get; set; }
		public int ProductId { get; set; }
	}
}
