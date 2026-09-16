using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Core.DTOs;
using Safiyan.Infrastructure.Data;
using Safiyan.Infrastructure.ExternalIntegrations;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UnsplashImageService _imageService;

    public ProductController(ApplicationDbContext context, UnsplashImageService imageService)
    {
        _context = context;
        _imageService = imageService;
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
                p.HasVariants,
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
                p.HasVariants,
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

        // Auto-fetch a matching image when the admin didn't upload/provide one.
        // Safe no-op if no Unsplash key is configured or the lookup fails.
        if (string.IsNullOrWhiteSpace(product.ImageUrl))
        {
            product.ImageUrl = await _imageService.FindImageUrlAsync(product.Name);
        }

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
    public async Task<IActionResult> UpdateProduct(int id, UpdateProductDto request)
    {
        if (request == null)
            return BadRequest(new { message = "Product data is required." });

        if (id != request.Id)
            return BadRequest(new { message = "Product ID mismatch." });

        var existingProduct = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == id);

        if (existingProduct == null)
            return NotFound(new { message = "Product not found." });

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
            .AnyAsync(p => p.SKU == request.SKU && p.Id != id);

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

        existingProduct.CategoryId = request.CategoryId;
        existingProduct.VendorId = request.VendorId;
        existingProduct.Name = request.Name.Trim();
        existingProduct.Description = request.Description?.Trim() ?? string.Empty;
        existingProduct.SKU = request.SKU.Trim();
        existingProduct.Price = request.Price;
        existingProduct.DiscountPrice = request.DiscountPrice;
        existingProduct.StockQuantity = request.StockQuantity;
        existingProduct.IsActive = request.IsActive;

        // Manual edits always win. Only auto-fetch when the incoming
        // ImageUrl is blank AND the product doesn't already have one —
        // this lets an admin clear an image on purpose without it being
        // silently refilled, while still auto-filling products that have
        // never had an image.
        var incomingImageUrl = request.ImageUrl?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(incomingImageUrl))
        {
            if (string.IsNullOrWhiteSpace(existingProduct.ImageUrl))
            {
                existingProduct.ImageUrl = await _imageService.FindImageUrlAsync(existingProduct.Name);
            }
            // else: leave the existing image alone.
        }
        else
        {
            existingProduct.ImageUrl = incomingImageUrl;
        }

        existingProduct.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Product/5 (soft delete)
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

    // DELETE: api/Product/5/force (hard delete â€” removes from DB including order items)
    [HttpDelete("{id:int}/force")]
    public async Task<IActionResult> ForceDeleteProduct(int id)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            return NotFound(new { message = "Product not found." });

        // Remove related order items first
        var orderItems = await _context.OrderItems
            .Where(oi => oi.ProductId == id)
            .ToListAsync();
        _context.OrderItems.RemoveRange(orderItems);

        // Remove related cart items
        var cartItems = await _context.CartItems
            .Where(ci => ci.ProductId == id)
            .ToListAsync();
        _context.CartItems.RemoveRange(cartItems);

        // Remove related wishlist items if exists
        var wishlistItems = await _context.WishlistItems
            .Where(wi => wi.ProductId == id)
            .ToListAsync();
        _context.WishlistItems.RemoveRange(wishlistItems);

        // Now remove the product
        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Product permanently deleted." });
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

    // POST: api/Product/backfill-images
    // One-off helper for existing products created before auto-image
    // lookup existed. Finds every product with no ImageUrl and tries to
    // fill it in via Unsplash. Products that already have an image are
    // left untouched. Safe to call more than once.
    [HttpPost("backfill-images")]
    public async Task<ActionResult<object>> BackfillImages()
    {
        var productsWithoutImages = await _context.Products
            .Where(p => p.ImageUrl == null || p.ImageUrl == string.Empty)
            .ToListAsync();

        var updated = new List<object>();
        var skipped = new List<object>();

        foreach (var product in productsWithoutImages)
        {
            var imageUrl = await _imageService.FindImageUrlAsync(product.Name);

            if (!string.IsNullOrWhiteSpace(imageUrl))
            {
                product.ImageUrl = imageUrl;
                product.UpdatedAt = DateTime.UtcNow;
                updated.Add(new { product.Id, product.Name, product.ImageUrl });
            }
            else
            {
                skipped.Add(new { product.Id, product.Name });
            }
        }

        if (updated.Count > 0)
            await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Updated {updated.Count} product{(updated.Count == 1 ? "" : "s")}, skipped {skipped.Count}.",
            updated,
            skipped
        });
    }

    // POST: api/Product/5/upload-image
    [HttpPost("{id:int}/upload-image")]
    public async Task<IActionResult> UploadImage(int id, IFormFile image)
    {
        if (image == null || image.Length == 0)
            return BadRequest(new { message = "Image file is required." });

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
        if (!allowedTypes.Contains(image.ContentType.ToLower()))
            return BadRequest(new { message = "Only JPEG, PNG, WEBP, GIF images are allowed." });

        if (image.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "Image size cannot exceed 5MB." });

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product == null)
            return NotFound(new { message = "Product not found." });

        var env = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
        var contentRoot = env.WebRootPath ?? env.ContentRootPath;
        var storage = new Safiyan.Infrastructure.Services.FileStorageService(contentRoot);

        using var stream = image.OpenReadStream();
        var imageUrl = await storage.SaveAsync(stream, image.FileName);

        product.ImageUrl = imageUrl;
        product.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Image uploaded successfully.", imageUrl });
    }

    // ---------------- Product image gallery (multi-image) ----------------

    // GET: api/Product/5/images
    [HttpGet("{id:int}/images")]
    public async Task<ActionResult<IEnumerable<object>>> GetProductImages(int id)
    {
        var productExists = await _context.Products.AnyAsync(p => p.Id == id);
        if (!productExists)
            return NotFound(new { message = "Product not found." });

        var images = await _context.ProductImages
            .AsNoTracking()
            .Where(i => i.ProductId == id)
            .OrderBy(i => i.DisplayOrder)
            .Select(i => new
            {
                i.Id,
                i.ProductId,
                i.ImageUrl,
                i.IsPrimary,
                i.DisplayOrder
            })
            .ToListAsync();

        return Ok(images);
    }

    // POST: api/Product/5/images  (register an already-uploaded image URL)
    [HttpPost("{id:int}/images")]
    public async Task<ActionResult<object>> AddProductImage(int id, AddProductImageDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.ImageUrl))
            return BadRequest(new { message = "ImageUrl is required." });

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product == null)
            return NotFound(new { message = "Product not found." });

        // If this is marked primary, un-mark any existing primary image first.
        if (request.IsPrimary)
        {
            var currentPrimary = await _context.ProductImages
                .Where(i => i.ProductId == id && i.IsPrimary)
                .ToListAsync();

            foreach (var img in currentPrimary)
                img.IsPrimary = false;
        }

        var image = new ProductImage
        {
            ProductId = id,
            ImageUrl = request.ImageUrl.Trim(),
            IsPrimary = request.IsPrimary,
            DisplayOrder = request.DisplayOrder,
            CreatedAt = DateTime.UtcNow
        };

        _context.ProductImages.Add(image);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            image.Id,
            image.ProductId,
            image.ImageUrl,
            image.IsPrimary,
            image.DisplayOrder
        });
    }

    // POST: api/Product/5/images/upload  (upload file + register as gallery image)
    [HttpPost("{id:int}/images/upload")]
    public async Task<IActionResult> UploadProductImage(int id, IFormFile image, [FromQuery] bool isPrimary = false)
    {
        if (image == null || image.Length == 0)
            return BadRequest(new { message = "Image file is required." });

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
        if (!allowedTypes.Contains(image.ContentType.ToLower()))
            return BadRequest(new { message = "Only JPEG, PNG, WEBP, GIF images are allowed." });

        if (image.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "Image size cannot exceed 5MB." });

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product == null)
            return NotFound(new { message = "Product not found." });

        var env = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
        var contentRoot = env.WebRootPath ?? env.ContentRootPath;
        var storage = new Safiyan.Infrastructure.Services.FileStorageService(contentRoot);

        using var stream = image.OpenReadStream();
        var imageUrl = await storage.SaveAsync(stream, image.FileName);

        if (isPrimary)
        {
            var currentPrimary = await _context.ProductImages
                .Where(i => i.ProductId == id && i.IsPrimary)
                .ToListAsync();

            foreach (var img in currentPrimary)
                img.IsPrimary = false;
        }

        var nextOrder = await _context.ProductImages
            .Where(i => i.ProductId == id)
            .Select(i => (int?)i.DisplayOrder)
            .MaxAsync() ?? -1;

        var entity = new ProductImage
        {
            ProductId = id,
            ImageUrl = imageUrl,
            IsPrimary = isPrimary,
            DisplayOrder = nextOrder + 1,
            CreatedAt = DateTime.UtcNow
        };

        _context.ProductImages.Add(entity);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            entity.Id,
            entity.ProductId,
            entity.ImageUrl,
            entity.IsPrimary,
            entity.DisplayOrder
        });
    }

    // PATCH: api/Product/5/images/12/set-primary
    [HttpPatch("{id:int}/images/{imageId:int}/set-primary")]
    public async Task<IActionResult> SetPrimaryImage(int id, int imageId)
    {
        var target = await _context.ProductImages
            .FirstOrDefaultAsync(i => i.Id == imageId && i.ProductId == id);

        if (target == null)
            return NotFound(new { message = "Image not found for this product." });

        var currentPrimary = await _context.ProductImages
            .Where(i => i.ProductId == id && i.IsPrimary && i.Id != imageId)
            .ToListAsync();

        foreach (var img in currentPrimary)
            img.IsPrimary = false;

        target.IsPrimary = true;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Primary image updated.", imageId });
    }

    // DELETE: api/Product/5/images/12
    [HttpDelete("{id:int}/images/{imageId:int}")]
    public async Task<IActionResult> DeleteProductImage(int id, int imageId)
    {
        var image = await _context.ProductImages
            .FirstOrDefaultAsync(i => i.Id == imageId && i.ProductId == id);

        if (image == null)
            return NotFound(new { message = "Image not found for this product." });

        _context.ProductImages.Remove(image);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ---------------- Product variants ----------------

    // GET: api/Product/5/variants
    [HttpGet("{id:int}/variants")]
    public async Task<ActionResult<IEnumerable<object>>> GetProductVariants(int id)
    {
        var productExists = await _context.Products.AnyAsync(p => p.Id == id);
        if (!productExists)
            return NotFound(new { message = "Product not found." });

        var variants = await _context.ProductVariants
            .AsNoTracking()
            .Where(v => v.ProductId == id)
            .Include(v => v.AttributeValues)
                .ThenInclude(av => av.ProductAttributeValue)
                    .ThenInclude(pav => pav.ProductAttribute)
            .OrderBy(v => v.Id)
            .Select(v => new
            {
                v.Id,
                v.ProductId,
                v.SKU,
                v.Price,
                v.DiscountPrice,
                v.StockQuantity,
                v.ImageUrl,
                v.IsActive,
                Attributes = v.AttributeValues.Select(av => new
                {
                    AttributeName = av.ProductAttributeValue.ProductAttribute.Name,
                    Value = av.ProductAttributeValue.Value
                })
            })
            .ToListAsync();

        return Ok(variants);
    }

    // POST: api/Product/5/variants
    [HttpPost("{id:int}/variants")]
    public async Task<ActionResult<object>> CreateProductVariant(int id, CreateProductVariantDto request)
    {
        if (request == null)
            return BadRequest(new { message = "Variant data is required." });

        if (string.IsNullOrWhiteSpace(request.SKU))
            return BadRequest(new { message = "SKU is required." });

        if (request.Price < 0)
            return BadRequest(new { message = "Price cannot be negative." });

        if (request.DiscountPrice < 0)
            return BadRequest(new { message = "Discount price cannot be negative." });

        if (request.StockQuantity < 0)
            return BadRequest(new { message = "Stock quantity cannot be negative." });

        if (request.AttributeValueIds == null || request.AttributeValueIds.Count == 0)
            return BadRequest(new { message = "At least one attribute value (e.g. Color, Size) is required." });

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product == null)
            return NotFound(new { message = "Product not found." });

        var skuExists = await _context.ProductVariants.AnyAsync(v => v.SKU == request.SKU);
        if (skuExists)
            return Conflict(new { message = "A variant with this SKU already exists." });

        var validValueIds = await _context.ProductAttributeValues
            .Where(v => request.AttributeValueIds.Contains(v.Id))
            .Select(v => v.Id)
            .ToListAsync();

        if (validValueIds.Count != request.AttributeValueIds.Distinct().Count())
            return BadRequest(new { message = "One or more AttributeValueIds are invalid." });

        var variant = new ProductVariant
        {
            ProductId = id,
            SKU = request.SKU.Trim(),
            Price = request.Price,
            DiscountPrice = request.DiscountPrice,
            StockQuantity = request.StockQuantity,
            ImageUrl = request.ImageUrl?.Trim() ?? string.Empty,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var valueId in validValueIds)
        {
            variant.AttributeValues.Add(new ProductVariantAttributeValue
            {
                ProductAttributeValueId = valueId
            });
        }

        _context.ProductVariants.Add(variant);

        product.HasVariants = true;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            variant.Id,
            variant.ProductId,
            variant.SKU,
            variant.Price,
            variant.DiscountPrice,
            variant.StockQuantity,
            variant.ImageUrl,
            variant.IsActive
        });
    }

    // PUT: api/Product/5/variants/9
    [HttpPut("{id:int}/variants/{variantId:int}")]
    public async Task<IActionResult> UpdateProductVariant(int id, int variantId, UpdateProductVariantDto request)
    {
        if (request == null || variantId != request.Id)
            return BadRequest(new { message = "Variant ID mismatch." });

        var variant = await _context.ProductVariants
            .Include(v => v.AttributeValues)
            .FirstOrDefaultAsync(v => v.Id == variantId && v.ProductId == id);

        if (variant == null)
            return NotFound(new { message = "Variant not found for this product." });

        if (string.IsNullOrWhiteSpace(request.SKU))
            return BadRequest(new { message = "SKU is required." });

        if (request.Price < 0)
            return BadRequest(new { message = "Price cannot be negative." });

        if (request.DiscountPrice < 0)
            return BadRequest(new { message = "Discount price cannot be negative." });

        if (request.StockQuantity < 0)
            return BadRequest(new { message = "Stock quantity cannot be negative." });

        var skuExists = await _context.ProductVariants
            .AnyAsync(v => v.SKU == request.SKU && v.Id != variantId);

        if (skuExists)
            return Conflict(new { message = "A variant with this SKU already exists." });

        if (request.AttributeValueIds != null && request.AttributeValueIds.Count > 0)
        {
            var validValueIds = await _context.ProductAttributeValues
                .Where(v => request.AttributeValueIds.Contains(v.Id))
                .Select(v => v.Id)
                .ToListAsync();

            if (validValueIds.Count != request.AttributeValueIds.Distinct().Count())
                return BadRequest(new { message = "One or more AttributeValueIds are invalid." });

            _context.ProductVariantAttributeValues.RemoveRange(variant.AttributeValues);

            foreach (var valueId in validValueIds)
            {
                variant.AttributeValues.Add(new ProductVariantAttributeValue
                {
                    ProductAttributeValueId = valueId
                });
            }
        }

        variant.SKU = request.SKU.Trim();
        variant.Price = request.Price;
        variant.DiscountPrice = request.DiscountPrice;
        variant.StockQuantity = request.StockQuantity;
        variant.ImageUrl = request.ImageUrl?.Trim() ?? string.Empty;
        variant.IsActive = request.IsActive;
        variant.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Product/5/variants/9
    [HttpDelete("{id:int}/variants/{variantId:int}")]
    public async Task<IActionResult> DeleteProductVariant(int id, int variantId)
    {
        var variant = await _context.ProductVariants
            .FirstOrDefaultAsync(v => v.Id == variantId && v.ProductId == id);

        if (variant == null)
            return NotFound(new { message = "Variant not found for this product." });

        var hasOrders = await _context.OrderItems.AnyAsync(oi => oi.ProductVariantId == variantId);
        if (hasOrders)
        {
            variant.IsActive = false;
            variant.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Variant has past orders and was deactivated instead of deleted." });
        }

        _context.ProductVariants.Remove(variant);

        var remainingVariants = await _context.ProductVariants
            .CountAsync(v => v.ProductId == id && v.Id != variantId);

        if (remainingVariants == 0)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product != null)
            {
                product.HasVariants = false;
                product.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
