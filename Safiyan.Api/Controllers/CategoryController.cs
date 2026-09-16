using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Infrastructure.Data;
using Safiyan.Infrastructure.ExternalIntegrations;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // any authenticated user (Admin or Vendor) can hit this controller by default;
            // write endpoints below are individually locked to Admin only.
public class CategoryController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UnsplashImageService _imageService;

    public CategoryController(ApplicationDbContext context, UnsplashImageService imageService)
    {
        _context = context;
        _imageService = imageService;
    }

    // GET: api/Category
    // Readable by Admin and Vendor (vendors need this to populate the
    // category dropdown when adding/editing their own products).
    [HttpGet]
    [Authorize(Roles = "Admin,Vendor")]
    public async Task<ActionResult<IEnumerable<object>>> GetCategories()
    {
        var categories = await _context.Categories
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Description,
                c.ImageUrl,
                c.IsActive,
                c.CommissionRate,
                c.ParentCategoryId,
                ParentCategoryName = c.ParentCategory != null ? c.ParentCategory.Name : null,
                c.CreatedAt,
                c.UpdatedAt,
                ProductCount = c.Products.Count
            })
            .ToListAsync();

        return Ok(categories);
    }

    // GET: api/Category/tree
    // Returns the full category tree (unlimited nesting), top-level categories first.
    [HttpGet("tree")]
    [Authorize(Roles = "Admin,Vendor")]
    public async Task<ActionResult<IEnumerable<object>>> GetCategoryTree()
    {
        var all = await _context.Categories
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.ImageUrl,
                c.CommissionRate,
                c.IsActive,
                c.ParentCategoryId
            })
            .ToListAsync();

        object BuildNode(dynamic c) => new
        {
            c.Id,
            c.Name,
            c.ImageUrl,
            c.CommissionRate,
            c.IsActive,
            SubCategories = all
                .Where(x => x.ParentCategoryId == c.Id)
                .Select(x => BuildNode(x))
                .ToList()
        };

        var tree = all
            .Where(c => c.ParentCategoryId == null)
            .Select(c => BuildNode(c))
            .ToList();

        return Ok(tree);
    }

    // GET: api/Category/5/subcategories
    // Direct children only (one level down).
    [HttpGet("{id:int}/subcategories")]
    [Authorize(Roles = "Admin,Vendor")]
    public async Task<ActionResult<IEnumerable<object>>> GetSubcategories(int id)
    {
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == id);
        if (!categoryExists)
            return NotFound(new { message = "Category not found." });

        var subcategories = await _context.Categories
            .AsNoTracking()
            .Where(c => c.ParentCategoryId == id)
            .OrderBy(c => c.Name)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Description,
                c.ImageUrl,
                c.IsActive,
                c.CommissionRate,
                ProductCount = c.Products.Count
            })
            .ToListAsync();

        return Ok(subcategories);
    }

    // GET: api/Category/5
    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,Vendor")]
    public async Task<ActionResult<object>> GetCategory(int id)
    {
        var category = await _context.Categories
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Description,
                c.ImageUrl,
                c.IsActive,
                c.CommissionRate,
                c.ParentCategoryId,
                ParentCategoryName = c.ParentCategory != null ? c.ParentCategory.Name : null,
                c.CreatedAt,
                c.UpdatedAt,
                ProductCount = c.Products.Count
            })
            .FirstOrDefaultAsync();

        if (category == null)
            return NotFound(new { message = "Category not found." });

        return Ok(category);
    }

    // POST: api/Category
    // Admin only — creating categories stays restricted.
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Category>> CreateCategory(Category category)
    {
        if (category == null)
            return BadRequest(new { message = "Category data is required." });

        if (string.IsNullOrWhiteSpace(category.Name))
            return BadRequest(new { message = "Category name is required." });

        var name = category.Name.Trim();

        var exists = await _context.Categories
            .AnyAsync(c => c.Name.ToLower() == name.ToLower());

        if (exists)
            return Conflict(new
            {
                message = "A category with this name already exists."
            });

        if (category.ParentCategoryId.HasValue)
        {
            var parentExists = await _context.Categories
                .AnyAsync(c => c.Id == category.ParentCategoryId.Value);

            if (!parentExists)
                return BadRequest(new { message = "Invalid ParentCategoryId." });
        }

        category.Id = 0;
        category.Name = name;
        category.CreatedAt = DateTime.UtcNow;
        category.UpdatedAt = null;

        // Auto-fetch a matching image when the admin didn't upload/provide one.
        // Safe no-op if no Unsplash key is configured or the lookup fails.
        if (string.IsNullOrWhiteSpace(category.ImageUrl))
        {
            category.ImageUrl = await _imageService.FindImageUrlAsync(name);
        }

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetCategory),
            new { id = category.Id },
            category
        );
    }

    // PUT: api/Category/5
    // Admin only.
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateCategory(
        int id,
        Category category)
    {
        if (id != category.Id)
            return BadRequest(new { message = "Category ID mismatch." });

        var existingCategory = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id);

        if (existingCategory == null)
            return NotFound(new { message = "Category not found." });

        if (string.IsNullOrWhiteSpace(category.Name))
            return BadRequest(new { message = "Category name is required." });

        var name = category.Name.Trim();

        var exists = await _context.Categories
            .AnyAsync(c =>
                c.Id != id &&
                c.Name.ToLower() == name.ToLower());

        if (exists)
            return Conflict(new
            {
                message = "A category with this name already exists."
            });

        if (category.ParentCategoryId.HasValue)
        {
            if (category.ParentCategoryId.Value == id)
                return BadRequest(new { message = "A category cannot be its own parent." });

            var parentExists = await _context.Categories
                .AnyAsync(c => c.Id == category.ParentCategoryId.Value);

            if (!parentExists)
                return BadRequest(new { message = "Invalid ParentCategoryId." });

            // Prevent creating a cycle: the chosen parent cannot be one of
            // this category's own descendants.
            var descendantIds = await GetDescendantIdsAsync(id);
            if (descendantIds.Contains(category.ParentCategoryId.Value))
                return BadRequest(new { message = "Cannot set a subcategory as the parent (would create a loop)." });
        }

        existingCategory.Name = name;
        existingCategory.Description = category.Description;
        existingCategory.IsActive = category.IsActive;
        existingCategory.CommissionRate = category.CommissionRate;
        existingCategory.ParentCategoryId = category.ParentCategoryId;
        existingCategory.UpdatedAt = DateTime.UtcNow;

        // Manual edits always win. Only auto-fetch when the incoming
        // ImageUrl is blank AND the category doesn't already have one —
        // this is what lets an admin clear an image on purpose without it
        // being silently refilled, while still auto-filling categories
        // that have never had an image.
        if (string.IsNullOrWhiteSpace(category.ImageUrl))
        {
            if (string.IsNullOrWhiteSpace(existingCategory.ImageUrl))
            {
                existingCategory.ImageUrl = await _imageService.FindImageUrlAsync(name);
            }
            // else: leave the existing image alone.
        }
        else
        {
            existingCategory.ImageUrl = category.ImageUrl;
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Category/5
    // Admin only.
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category = await _context.Categories
            .Include(c => c.Products)
            .Include(c => c.SubCategories)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            return NotFound(new { message = "Category not found." });

        if (category.Products.Any())
        {
            return BadRequest(new
            {
                message = "This category contains products and cannot be deleted. Deactivate it instead."
            });
        }

        if (category.SubCategories.Any())
        {
            return BadRequest(new
            {
                message = "This category has subcategories and cannot be deleted. Remove or reassign them first."
            });
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // PATCH: api/Category/5/toggle
    // Admin only.
    [HttpPatch("{id:int}/toggle")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleCategory(int id)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            return NotFound(new { message = "Category not found." });

        category.IsActive = !category.IsActive;
        category.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            category.Id,
            category.IsActive,
            message = category.IsActive
                ? "Category activated."
                : "Category deactivated."
        });
    }

    // POST: api/Category/backfill-images
    // Admin only — one-off maintenance helper.
    [HttpPost("backfill-images")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> BackfillImages()
    {
        var categoriesWithoutImages = await _context.Categories
            .Where(c => c.ImageUrl == null || c.ImageUrl == string.Empty)
            .ToListAsync();

        var updated = new List<object>();
        var skipped = new List<object>();

        foreach (var category in categoriesWithoutImages)
        {
            var imageUrl = await _imageService.FindImageUrlAsync(category.Name);

            if (!string.IsNullOrWhiteSpace(imageUrl))
            {
                category.ImageUrl = imageUrl;
                category.UpdatedAt = DateTime.UtcNow;
                updated.Add(new { category.Id, category.Name, category.ImageUrl });
            }
            else
            {
                skipped.Add(new { category.Id, category.Name });
            }
        }

        if (updated.Count > 0)
            await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Updated {updated.Count} categor{(updated.Count == 1 ? "y" : "ies")}, skipped {skipped.Count}.",
            updated,
            skipped
        });
    }

    // Walks the subtree below id and returns every descendant category id.
    // Used to block a parent-reassignment that would create a cycle.
    private async Task<List<int>> GetDescendantIdsAsync(int id)
    {
        var all = await _context.Categories
            .AsNoTracking()
            .Select(c => new { c.Id, c.ParentCategoryId })
            .ToListAsync();

        var result = new List<int>();
        var queue = new Queue<int>();
        queue.Enqueue(id);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            var children = all.Where(c => c.ParentCategoryId == current).Select(c => c.Id);
            foreach (var childId in children)
            {
                result.Add(childId);
                queue.Enqueue(childId);
            }
        }

        return result;
    }
}