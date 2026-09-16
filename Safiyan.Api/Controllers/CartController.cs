using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CartController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Cart/user/5
    [HttpGet("user/{userId:int}")]
    public async Task<ActionResult<object>> GetCart(int userId)
    {
        var userExists = await _context.Users
            .AnyAsync(u => u.Id == userId);

        if (!userExists)
            return NotFound(new { message = "User not found." });

        var cart = await _context.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
        {
            cart = new Cart
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();
        }

        var items = cart.Items
            .Where(i => i.Product.IsActive)
            .Select(i => new
            {
                i.Id,
                i.ProductId,
                ProductName = i.Product.Name,
                ProductSKU = i.Product.SKU,
                ProductImage = i.Product.ImageUrl,
                i.Quantity,
                i.UnitPrice,
                LineTotal = i.UnitPrice * i.Quantity,
                AvailableStock = i.Product.StockQuantity
            })
            .ToList();

        var subtotal = items.Sum(i => i.LineTotal);

        return Ok(new
        {
            cart.Id,
            cart.UserId,
            cart.CreatedAt,
            cart.UpdatedAt,
            Items = items,
            ItemCount = items.Sum(i => i.Quantity),
            SubTotal = subtotal
        });
    }

    // POST: api/Cart/add
    [HttpPost("add")]
    public async Task<ActionResult<object>> AddToCart(AddCartItemRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "Cart item data is required." });

        if (request.UserId <= 0)
            return BadRequest(new { message = "Valid UserId is required." });

        if (request.ProductId <= 0)
            return BadRequest(new { message = "Valid ProductId is required." });

        if (request.Quantity <= 0)
            return BadRequest(new { message = "Quantity must be greater than zero." });

        var userExists = await _context.Users
            .AnyAsync(u => u.Id == request.UserId);

        if (!userExists)
            return NotFound(new { message = "User not found." });

        var product = await _context.Products
            .FirstOrDefaultAsync(p =>
                p.Id == request.ProductId &&
                p.IsActive);

        if (product == null)
            return NotFound(new { message = "Product not found or inactive." });

        if (product.StockQuantity <= 0)
        {
            return BadRequest(new
            {
                message = "This product is currently out of stock."
            });
        }

        var cart = await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == request.UserId);

        if (cart == null)
        {
            cart = new Cart
            {
                UserId = request.UserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();
        }

        var existingItem = cart.Items
            .FirstOrDefault(i => i.ProductId == request.ProductId);

        var newQuantity = request.Quantity;

        if (existingItem != null)
            newQuantity += existingItem.Quantity;

        if (newQuantity > product.StockQuantity)
        {
            return BadRequest(new
            {
                message = $"Only {product.StockQuantity} item(s) are available in stock.",
                availableStock = product.StockQuantity
            });
        }

        var unitPrice = product.DiscountPrice > 0
            ? product.DiscountPrice
            : product.Price;

        if (existingItem != null)
        {
            existingItem.Quantity = newQuantity;
            existingItem.UnitPrice = unitPrice;
            existingItem.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            cart.Items.Add(new CartItem
            {
                ProductId = product.Id,
                Quantity = request.Quantity,
                UnitPrice = unitPrice,
                CreatedAt = DateTime.UtcNow
            });
        }

        cart.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Product added to cart successfully.",
            productId = product.Id,
            quantity = newQuantity,
            unitPrice
        });
    }

    // PUT: api/Cart/item/5
    [HttpPut("item/{itemId:int}")]
    public async Task<IActionResult> UpdateCartItem(
        int itemId,
        UpdateCartItemRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "Cart item data is required." });

        if (request.Quantity <= 0)
            return BadRequest(new
            {
                message = "Quantity must be greater than zero."
            });

        var item = await _context.CartItems
            .Include(i => i.Cart)
            .Include(i => i.Product)
            .FirstOrDefaultAsync(i => i.Id == itemId);

        if (item == null)
            return NotFound(new { message = "Cart item not found." });

        if (!item.Product.IsActive)
            return BadRequest(new
            {
                message = "This product is no longer available."
            });

        if (request.Quantity > item.Product.StockQuantity)
        {
            return BadRequest(new
            {
                message = $"Only {item.Product.StockQuantity} item(s) are available in stock.",
                availableStock = item.Product.StockQuantity
            });
        }

        item.Quantity = request.Quantity;

        item.UnitPrice = item.Product.DiscountPrice > 0
            ? item.Product.DiscountPrice
            : item.Product.Price;

        item.UpdatedAt = DateTime.UtcNow;
        item.Cart.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Cart item updated successfully.",
            item.Id,
            item.ProductId,
            item.Quantity,
            item.UnitPrice,
            Total = item.Quantity * item.UnitPrice
        });
    }

    // DELETE: api/Cart/item/5
    [HttpDelete("item/{itemId:int}")]
    public async Task<IActionResult> RemoveCartItem(int itemId)
    {
        var item = await _context.CartItems
            .Include(i => i.Cart)
            .FirstOrDefaultAsync(i => i.Id == itemId);

        if (item == null)
            return NotFound(new { message = "Cart item not found." });

        item.Cart.UpdatedAt = DateTime.UtcNow;

        _context.CartItems.Remove(item);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Cart item removed successfully."
        });
    }

    // DELETE: api/Cart/user/5/clear
    [HttpDelete("user/{userId:int}/clear")]
    public async Task<IActionResult> ClearCart(int userId)
    {
        var cart = await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
            return NotFound(new { message = "Cart not found." });

        if (cart.Items.Any())
        {
            _context.CartItems.RemoveRange(cart.Items);
        }

        cart.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Cart cleared successfully."
        });
    }

    // GET: api/Cart/user/5/count
    [HttpGet("user/{userId:int}/count")]
    public async Task<ActionResult<object>> GetCartCount(int userId)
    {
        var userExists = await _context.Users
            .AnyAsync(u => u.Id == userId);

        if (!userExists)
            return NotFound(new { message = "User not found." });

        var count = await _context.CartItems
            .Where(i =>
                i.Cart.UserId == userId &&
                i.Product.IsActive)
            .SumAsync(i => (int?)i.Quantity) ?? 0;

        return Ok(new
        {
            userId,
            itemCount = count
        });
    }

    public class AddCartItemRequest
    {
        public int UserId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; } = 1;
    }

    public class UpdateCartItemRequest
    {
        public int Quantity { get; set; }
    }
}
