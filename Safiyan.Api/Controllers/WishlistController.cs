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

    // ============================================================
    // GET USER'S WISHLIST (creates one if it doesn't exist yet)
    // GET /api/Wishlist/user/{userId}
    // ============================================================

    [HttpGet("user/{userId:int}")]
    public async Task<ActionResult<object>> GetUserWishlist(int userId)
    {
        var wishlist = await GetOrCreateWishlistAsync(userId);

        var items = await _context.WishlistItems
            .AsNoTracking()
            .Include(i => i.Product)
            .Where(i => i.WishlistId == wishlist.Id)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new
            {
                i.Id,
                i.ProductId,
                ProductName = i.Product.Name,
                ProductImageUrl = i.Product.ImageUrl,
                Price = i.Product.DiscountPrice > 0
                    ? i.Product.DiscountPrice
                    : i.Product.Price,
                OriginalPrice = i.Product.Price,
                InStock = i.Product.StockQuantity > 0,
                i.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            wishlistId = wishlist.Id,
            totalItems = items.Count,
            items
        });
    }

    // ============================================================
    // ADD PRODUCT TO WISHLIST
    // POST /api/Wishlist/add
    // Body: { userId, productId }
    // ============================================================

    [HttpPost("add")]
    public async Task<ActionResult<object>> AddToWishlist(WishlistItemRequest request)
    {
        if (request == null || request.UserId <= 0 || request.ProductId <= 0)
            return BadRequest(new { message = "UserId and ProductId are required." });

        var productExists = await _context.Products
            .AnyAsync(p => p.Id == request.ProductId);

        if (!productExists)
            return NotFound(new { message = "Product not found." });

        var wishlist = await GetOrCreateWishlistAsync(request.UserId);

        var alreadyExists = await _context.WishlistItems
            .AnyAsync(i =>
                i.WishlistId == wishlist.Id &&
                i.ProductId == request.ProductId);

        if (alreadyExists)
            return Ok(new { message = "Product is already in your wishlist." });

        _context.WishlistItems.Add(new WishlistItem
        {
            WishlistId = wishlist.Id,
            ProductId = request.ProductId,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new { message = "Product added to wishlist." });
    }

    // ============================================================
    // REMOVE PRODUCT FROM WISHLIST
    // DELETE /api/Wishlist/remove
    // Body: { userId, productId }
    // ============================================================

    [HttpDelete("remove")]
    public async Task<ActionResult<object>> RemoveFromWishlist(WishlistItemRequest request)
    {
        if (request == null || request.UserId <= 0 || request.ProductId <= 0)
            return BadRequest(new { message = "UserId and ProductId are required." });

        var wishlist = await _context.Wishlists
            .FirstOrDefaultAsync(w => w.UserId == request.UserId);

        if (wishlist == null)
            return Ok(new { message = "Product removed from wishlist." });

        var item = await _context.WishlistItems
            .FirstOrDefaultAsync(i =>
                i.WishlistId == wishlist.Id &&
                i.ProductId == request.ProductId);

        if (item != null)
        {
            _context.WishlistItems.Remove(item);
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Product removed from wishlist." });
    }

    // ============================================================
    // TOGGLE (add if missing, remove if present) — handy for a
    // single heart-icon button on the frontend.
    // POST /api/Wishlist/toggle
    // Body: { userId, productId }
    // ============================================================

    [HttpPost("toggle")]
    public async Task<ActionResult<object>> ToggleWishlist(WishlistItemRequest request)
    {
        if (request == null || request.UserId <= 0 || request.ProductId <= 0)
            return BadRequest(new { message = "UserId and ProductId are required." });

        var productExists = await _context.Products
            .AnyAsync(p => p.Id == request.ProductId);

        if (!productExists)
            return NotFound(new { message = "Product not found." });

        var wishlist = await GetOrCreateWishlistAsync(request.UserId);

        var existingItem = await _context.WishlistItems
            .FirstOrDefaultAsync(i =>
                i.WishlistId == wishlist.Id &&
                i.ProductId == request.ProductId);

        if (existingItem != null)
        {
            _context.WishlistItems.Remove(existingItem);
            await _context.SaveChangesAsync();

            return Ok(new { inWishlist = false, message = "Removed from wishlist." });
        }

        _context.WishlistItems.Add(new WishlistItem
        {
            WishlistId = wishlist.Id,
            ProductId = request.ProductId,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new { inWishlist = true, message = "Added to wishlist." });
    }

    // ============================================================
    // CHECK IF A PRODUCT IS IN THE USER'S WISHLIST
    // GET /api/Wishlist/check?userId=1&productId=5
    // ============================================================

    [HttpGet("check")]
    public async Task<ActionResult<object>> CheckWishlist(
        [FromQuery] int userId,
        [FromQuery] int productId)
    {
        var inWishlist = await _context.WishlistItems
            .AnyAsync(i =>
                i.Wishlist.UserId == userId &&
                i.ProductId == productId);

        return Ok(new { inWishlist });
    }

    // ============================================================
    // HELPER: get or create a wishlist for a user
    // ============================================================

    private async Task<Wishlist> GetOrCreateWishlistAsync(int userId)
    {
        var wishlist = await _context.Wishlists
            .FirstOrDefaultAsync(w => w.UserId == userId);

        if (wishlist != null)
            return wishlist;

        wishlist = new Wishlist
        {
            UserId = userId,
            Name = "My Wishlist",
            CreatedAt = DateTime.UtcNow
        };

        _context.Wishlists.Add(wishlist);
        await _context.SaveChangesAsync();

        return wishlist;
    }

    // ============================================================
    // REQUEST MODEL
    // ============================================================

    public class WishlistItemRequest
    {
        public int UserId { get; set; }
        public int ProductId { get; set; }
    }
}
