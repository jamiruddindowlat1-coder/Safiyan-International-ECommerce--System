using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class CategoryController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CategoryController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Category
    [HttpGet]
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
                c.CreatedAt,
                c.UpdatedAt,
                ProductCount = c.Products.Count
            })
            .ToListAsync();

        return Ok(categories);
    }

    // GET: api/Category/5
    [HttpGet("{id:int}")]
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
    [HttpPost]
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

        category.Id = 0;
        category.Name = name;
        category.CreatedAt = DateTime.UtcNow;
        category.UpdatedAt = null;

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetCategory),
            new { id = category.Id },
            category
        );
    }

    // PUT: api/Category/5
    [HttpPut("{id:int}")]
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

        existingCategory.Name = name;
        existingCategory.Description = category.Description;
        existingCategory.ImageUrl = category.ImageUrl;
        existingCategory.IsActive = category.IsActive;
        existingCategory.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Category/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category = await _context.Categories
            .Include(c => c.Products)
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

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // PATCH: api/Category/5/toggle
    [HttpPatch("{id:int}/toggle")]
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
}
