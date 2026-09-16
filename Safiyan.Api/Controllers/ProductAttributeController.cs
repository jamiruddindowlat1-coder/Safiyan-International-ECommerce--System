using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Core.DTOs;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ProductAttributeController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProductAttributeController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/ProductAttribute
    // Returns every attribute type with its values, e.g. Color: [Red, Blue], Size: [S, M, L]
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<object>>> GetAttributes()
    {
        var attributes = await _context.ProductAttributes
            .AsNoTracking()
            .Include(a => a.Values)
            .OrderBy(a => a.Name)
            .Select(a => new
            {
                a.Id,
                a.Name,
                Values = a.Values
                    .OrderBy(v => v.Value)
                    .Select(v => new { v.Id, v.Value })
            })
            .ToListAsync();

        return Ok(attributes);
    }

    // POST: api/ProductAttribute
    [HttpPost]
    public async Task<ActionResult<object>> CreateAttribute(CreateProductAttributeDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Attribute name is required." });

        var name = request.Name.Trim();

        var exists = await _context.ProductAttributes
            .AnyAsync(a => a.Name.ToLower() == name.ToLower());

        if (exists)
            return Conflict(new { message = "An attribute with this name already exists." });

        var attribute = new ProductAttribute
        {
            Name = name,
            CreatedAt = DateTime.UtcNow
        };

        _context.ProductAttributes.Add(attribute);
        await _context.SaveChangesAsync();

        return Ok(new { attribute.Id, attribute.Name });
    }

    // DELETE: api/ProductAttribute/3
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAttribute(int id)
    {
        var attribute = await _context.ProductAttributes
            .Include(a => a.Values)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (attribute == null)
            return NotFound(new { message = "Attribute not found." });

        var inUse = await _context.ProductVariantAttributeValues
            .AnyAsync(link => attribute.Values.Select(v => v.Id).Contains(link.ProductAttributeValueId));

        if (inUse)
            return BadRequest(new { message = "This attribute is used by existing product variants and cannot be deleted." });

        _context.ProductAttributes.Remove(attribute);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/ProductAttribute/3/values
    [HttpPost("{attributeId:int}/values")]
    public async Task<ActionResult<object>> AddValue(int attributeId, CreateProductAttributeValueDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Value))
            return BadRequest(new { message = "Value is required." });

        var attribute = await _context.ProductAttributes.FirstOrDefaultAsync(a => a.Id == attributeId);
        if (attribute == null)
            return NotFound(new { message = "Attribute not found." });

        var value = request.Value.Trim();

        var exists = await _context.ProductAttributeValues
            .AnyAsync(v => v.ProductAttributeId == attributeId && v.Value.ToLower() == value.ToLower());

        if (exists)
            return Conflict(new { message = "This value already exists for the attribute." });

        var entity = new ProductAttributeValue
        {
            ProductAttributeId = attributeId,
            Value = value
        };

        _context.ProductAttributeValues.Add(entity);
        await _context.SaveChangesAsync();

        return Ok(new { entity.Id, entity.ProductAttributeId, entity.Value });
    }

    // DELETE: api/ProductAttribute/values/12
    [HttpDelete("values/{valueId:int}")]
    public async Task<IActionResult> DeleteValue(int valueId)
    {
        var value = await _context.ProductAttributeValues.FirstOrDefaultAsync(v => v.Id == valueId);
        if (value == null)
            return NotFound(new { message = "Attribute value not found." });

        var inUse = await _context.ProductVariantAttributeValues
            .AnyAsync(link => link.ProductAttributeValueId == valueId);

        if (inUse)
            return BadRequest(new { message = "This value is used by existing product variants and cannot be deleted." });

        _context.ProductAttributeValues.Remove(value);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}