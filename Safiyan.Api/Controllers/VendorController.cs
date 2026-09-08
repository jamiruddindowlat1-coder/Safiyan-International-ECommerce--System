using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Core.DTOs;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Vendor,Admin")]
public class VendorController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public VendorController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Vendor
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetVendors()
    {
        var vendors = await _context.Vendors
            .AsNoTracking()
            .Include(v => v.User)
            .OrderByDescending(v => v.CreatedAt)
            .Select(v => new
            {
                v.Id,
                v.UserId,
                v.StoreName,
                v.StoreDescription,
                v.Phone,
                v.Address,
                v.IsApproved,
                v.CreatedAt,
                v.UpdatedAt,
                OwnerName = v.User.FullName,
                OwnerEmail = v.User.Email,
                ProductCount = v.Products.Count
            })
            .ToListAsync();

        return Ok(vendors);
    }

    // GET: api/Vendor/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<object>> GetVendor(int id)
    {
        var vendor = await _context.Vendors
            .AsNoTracking()
            .Include(v => v.User)
            .Where(v => v.Id == id)
            .Select(v => new
            {
                v.Id,
                v.UserId,
                v.StoreName,
                v.StoreDescription,
                v.Phone,
                v.Address,
                v.IsApproved,
                v.CreatedAt,
                v.UpdatedAt,
                OwnerName = v.User.FullName,
                OwnerEmail = v.User.Email,
                ProductCount = v.Products.Count
            })
            .FirstOrDefaultAsync();

        if (vendor == null)
            return NotFound(new { message = "Vendor not found." });

        return Ok(vendor);
    }

    // POST: api/Vendor
    [HttpPost]
    public async Task<ActionResult<Vendor>> CreateVendor(CreateVendorDto request)
    {
        if (request == null)
            return BadRequest(new { message = "Vendor data is required." });

        if (request.UserId <= 0)
            return BadRequest(new { message = "Valid UserId is required." });

        if (string.IsNullOrWhiteSpace(request.StoreName))
            return BadRequest(new { message = "Store name is required." });

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId);

        if (user == null)
            return BadRequest(new { message = "User not found." });

        var existingVendor = await _context.Vendors
            .AnyAsync(v => v.UserId == request.UserId);

        if (existingVendor)
            return Conflict(new
            {
                message = "This user already has a vendor profile."
            });

        var vendor = new Vendor
        {
            UserId = request.UserId,
            StoreName = request.StoreName.Trim(),
            StoreDescription = request.StoreDescription?.Trim() ?? string.Empty,
            Phone = request.Phone?.Trim() ?? string.Empty,
            Address = request.Address?.Trim() ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        _context.Vendors.Add(vendor);

        // Keep User.Role consistent with the existing string-based entity.
        user.Role = "Vendor";
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetVendor),
            new { id = vendor.Id },
            vendor
        );
    }

    // PUT: api/Vendor/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateVendor(
        int id,
        Vendor vendor)
    {
        if (id != vendor.Id)
            return BadRequest(new { message = "Vendor ID mismatch." });

        var existingVendor = await _context.Vendors
            .FirstOrDefaultAsync(v => v.Id == id);

        if (existingVendor == null)
            return NotFound(new { message = "Vendor not found." });

        if (vendor.UserId <= 0)
            return BadRequest(new { message = "Valid UserId is required." });

        if (string.IsNullOrWhiteSpace(vendor.StoreName))
            return BadRequest(new { message = "Store name is required." });

        var userExists = await _context.Users
            .AnyAsync(u => u.Id == vendor.UserId);

        if (!userExists)
            return BadRequest(new { message = "User not found." });

        var userAlreadyUsed = await _context.Vendors
            .AnyAsync(v => v.UserId == vendor.UserId && v.Id != id);

        if (userAlreadyUsed)
            return Conflict(new
            {
                message = "This user already belongs to another vendor."
            });

        existingVendor.UserId = vendor.UserId;
        existingVendor.StoreName = vendor.StoreName.Trim();
        existingVendor.StoreDescription = vendor.StoreDescription;
        existingVendor.Phone = vendor.Phone;
        existingVendor.Address = vendor.Address;
        existingVendor.IsApproved = vendor.IsApproved;
        existingVendor.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Vendor/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteVendor(int id)
    {
        var vendor = await _context.Vendors
            .Include(v => v.Products)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vendor == null)
            return NotFound(new { message = "Vendor not found." });

        if (vendor.Products.Any())
        {
            return BadRequest(new
            {
                message = "This vendor has products and cannot be deleted. Deactivate or reassign the products first."
            });
        }

        _context.Vendors.Remove(vendor);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // PATCH: api/Vendor/5/approve
    [HttpPatch("{id:int}/approve")]
    public async Task<IActionResult> ApproveVendor(int id)
    {
        var vendor = await _context.Vendors
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vendor == null)
            return NotFound(new { message = "Vendor not found." });

        vendor.IsApproved = true;
        vendor.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            vendor.Id,
            vendor.IsApproved,
            message = "Vendor approved successfully."
        });
    }

    // PATCH: api/Vendor/5/reject
    [HttpPatch("{id:int}/reject")]
    public async Task<IActionResult> RejectVendor(int id)
    {
        var vendor = await _context.Vendors
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vendor == null)
            return NotFound(new { message = "Vendor not found." });

        vendor.IsApproved = false;
        vendor.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            vendor.Id,
            vendor.IsApproved,
            message = "Vendor rejected successfully."
        });
    }
}
