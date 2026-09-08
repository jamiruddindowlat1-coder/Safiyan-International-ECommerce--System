using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Core.DTOs;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProductController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Product
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetProducts()
    {
        var products = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Vendor)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.CategoryId,
                CategoryName = p.Category.Name,
                p.VendorId,
                VendorName = p.Vendor.StoreName,
                p.Name,
                p.Description,
                p.SKU,
                p.Price,
                p.DiscountPrice,
                p.StockQuantity,
                p.ImageUrl,
                p.IsActive,
                p.CreatedAt,
                p.UpdatedAt
            })
            .ToListAsync();

        return Ok(products);
    }

    // GET: api/Product/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<object>> GetProduct(int id)
    {
        var product = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Vendor)
            .Where(p => p.Id == id)
            .Select(p => new
            {
                p.Id,
                p.CategoryId,
                CategoryName = p.Category.Name,
                p.VendorId,
                VendorName = p.Vendor.StoreName,
                p.Name,
                p.Description,
                p.SKU,
                p.Price,
                p.DiscountPrice,
                p.StockQuantity,
                p.ImageUrl,
                p.IsActive,
                p.CreatedAt,
                p.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (product == null)
            return NotFound(new { message = "Product not found." });

        return Ok(product);
    }

    // POST: api/Product
    [HttpPost]
    public async Task<ActionResult<Product>> CreateProduct(CreateProductDto request)
    {
        if (request == null)
            return BadRequest(new { message = "Product data is required." });

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Product name is required." });

        if (string.IsNullOrWhiteSpace(request.SKU))
            return BadRequest(new { message = "SKU is required." });

        if (request.Price < 0)
            return BadRequest(new { message = "Price cannot be negative." });

        if (request.DiscountPrice < 0)
            return BadRequest(new { message = "Discount price cannot be negative." });

        if (request.StockQuantity < 0)
            return BadRequest(new { message = "Stock quantity cannot be negative." });

        var skuExists = await _context.Products
            .AnyAsync(p => p.SKU == request.SKU);

        if (skuExists)
            return Conflict(new { message = "A product with this SKU already exists." });

        var categoryExists = await _context.Categories
            .AnyAsync(c => c.Id == request.CategoryId);

        if (!categoryExists)
            return BadRequest(new { message = "Invalid CategoryId." });

        var vendorExists = await _context.Vendors
            .AnyAsync(v => v.Id == request.VendorId);

        if (!vendorExists)
            return BadRequest(new { message = "Invalid VendorId." });

        var product = new Product
        {
            CategoryId = request.CategoryId,
            VendorId = request.VendorId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            SKU = request.SKU.Trim(),
            Price = request.Price,
            DiscountPrice = request.DiscountPrice,
            StockQuantity = request.StockQuantity,
            ImageUrl = request.ImageUrl?.Trim() ?? string.Empty,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetProduct),
            new { id = product.Id },
            product
        );
    }

    // PUT: api/Product/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateProduct(int id, Product product)
    {
        if (id != product.Id)
            return BadRequest(new { message = "Product ID mismatch." });

        var existingProduct = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == id);

        if (existingProduct == null)
            return NotFound(new { message = "Product not found." });

        if (string.IsNullOrWhiteSpace(product.Name))
            return BadRequest(new { message = "Product name is required." });

        if (string.IsNullOrWhiteSpace(product.SKU))
            return BadRequest(new { message = "SKU is required." });

        if (product.Price < 0)
            return BadRequest(new { message = "Price cannot be negative." });

        if (product.DiscountPrice < 0)
            return BadRequest(new { message = "Discount price cannot be negative." });

        if (product.StockQuantity < 0)
            return BadRequest(new { message = "Stock quantity cannot be negative." });

        var skuExists = await _context.Products
            .AnyAsync(p => p.SKU == product.SKU && p.Id != id);

        if (skuExists)
            return Conflict(new { message = "A product with this SKU already exists." });

        var categoryExists = await _context.Categories
            .AnyAsync(c => c.Id == product.CategoryId);

        if (!categoryExists)
            return BadRequest(new { message = "Invalid CategoryId." });

        var vendorExists = await _context.Vendors
            .AnyAsync(v => v.Id == product.VendorId);

        if (!vendorExists)
            return BadRequest(new { message = "Invalid VendorId." });

        existingProduct.CategoryId = product.CategoryId;
        existingProduct.VendorId = product.VendorId;
        existingProduct.Name = product.Name;
        existingProduct.Description = product.Description;
        existingProduct.SKU = product.SKU;
        existingProduct.Price = product.Price;
        existingProduct.DiscountPrice = product.DiscountPrice;
        existingProduct.StockQuantity = product.StockQuantity;
        existingProduct.ImageUrl = product.ImageUrl;
        existingProduct.IsActive = product.IsActive;
        existingProduct.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Product/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            return NotFound(new { message = "Product not found." });

        // Soft delete
        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // PATCH: api/Product/5/toggle
    [HttpPatch("{id:int}/toggle")]
    public async Task<IActionResult> ToggleProduct(int id)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            return NotFound(new { message = "Product not found." });

        product.IsActive = !product.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            product.Id,
            product.IsActive,
            message = product.IsActive
                ? "Product activated."
                : "Product deactivated."
        });
    }
}
