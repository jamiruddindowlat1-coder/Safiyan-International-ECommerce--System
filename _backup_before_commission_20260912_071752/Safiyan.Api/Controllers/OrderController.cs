using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Core.Enums;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrderController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public OrderController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetOrders()
    {
        var orders = await _context.Orders
            .AsNoTracking()
            .Include(o => o.User)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new
            {
                o.Id,
                o.OrderNumber,
                UserId = o.UserId,
                CustomerName = o.User.FullName,
                o.SubTotal,
                o.DiscountAmount,
                o.ShippingAmount,
                o.TaxAmount,
                o.TotalAmount,
                o.Status,
                o.PaymentStatus,
                o.CreatedAt,
                o.UpdatedAt
            })
            .ToListAsync();

        return Ok(orders);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<object>> GetOrder(int id)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .Include(o => o.User)
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Where(o => o.Id == id)
            .Select(o => new
            {
                o.Id,
                o.OrderNumber,
                o.UserId,
                CustomerName = o.User.FullName,
                o.SubTotal,
                o.DiscountAmount,
                o.ShippingAmount,
                o.TaxAmount,
                o.TotalAmount,
                o.Status,
                o.PaymentStatus,
                o.ShippingName,
                o.ShippingPhone,
                o.ShippingAddress,
                o.ShippingCity,
                o.ShippingPostalCode,
                o.ShippingCountry,
                o.CreatedAt,
                o.UpdatedAt,
                Items = o.Items.Select(i => new
                {
                    i.Id,
                    i.ProductId,
                    ProductName = i.Product.Name,
                    ProductSKU = i.Product.SKU,
                    i.Quantity,
                    i.UnitPrice,
                    i.DiscountAmount,
                    i.TotalPrice,
                    i.VendorId
                })
            })
            .FirstOrDefaultAsync();

        if (order == null)
            return NotFound(new { message = "Order not found." });

        return Ok(order);
    }

    [HttpGet("user/{userId:int}")]
    public async Task<ActionResult<IEnumerable<object>>> GetUserOrders(int userId)
    {
        var orders = await _context.Orders
            .AsNoTracking()
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new
            {
                o.Id,
                o.OrderNumber,
                o.SubTotal,
                o.TotalAmount,
                o.Status,
                o.PaymentStatus,
                o.CreatedAt
            })
            .ToListAsync();

        return Ok(orders);
    }

    [HttpPost]
    public async Task<ActionResult<object>> CreateOrder(CreateOrderRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "Order data is required." });

        if (request.UserId <= 0)
            return BadRequest(new { message = "Valid UserId is required." });

        var userExists = await _context.Users.AnyAsync(u => u.Id == request.UserId);
        if (!userExists)
            return NotFound(new { message = "User not found." });

        var cart = await _context.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == request.UserId);

        if (cart == null || cart.Items.Count == 0)
            return BadRequest(new { message = "Cart is empty." });

        var orderItems = new List<OrderItem>();
decimal subtotal = 0m;
decimal discountTotal = 0m;

var inactiveItems = cart.Items
    .Where(i => i.Product == null || !i.Product.IsActive)
    .ToList();

if (inactiveItems.Any())
{
    _context.CartItems.RemoveRange(inactiveItems);
    await _context.SaveChangesAsync();
}

var activeItems = cart.Items
    .Where(i => i.Product != null && i.Product.IsActive)
    .ToList();

if (!activeItems.Any())
    return BadRequest(new { message = "Cart is empty." });

foreach (var item in activeItems)
{
    if (item.Quantity > item.Product.StockQuantity)
    {
        return BadRequest(new
        {
            message = $"Only {item.Product.StockQuantity} unit(s) left for {item.Product.Name}."
        });
    }

    var unitPrice = item.Product.DiscountPrice > 0
        ? item.Product.DiscountPrice
        : item.Product.Price;

    var itemTotal = unitPrice * item.Quantity;
    subtotal += itemTotal;

    orderItems.Add(new OrderItem
    {
        ProductId = item.ProductId,
        VendorId = item.Product.VendorId,
        ProductName = item.Product.Name,
        ProductSKU = item.Product.SKU,
        Quantity = item.Quantity,
        UnitPrice = unitPrice,
        DiscountAmount = 0m,
        TotalPrice = itemTotal,
        CreatedAt = DateTime.UtcNow
    });
}

        if (!orderItems.Any())
            return BadRequest(new { message = "No valid items found in cart." });

        var shippingAmount = request.ShippingAmount ?? 0m;
        var taxAmount = request.TaxAmount ?? 0m;
        var totalAmount = subtotal + shippingAmount + taxAmount - discountTotal;

        var order = new Order
        {
            UserId = request.UserId,
            OrderNumber = $"SO-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
            SubTotal = subtotal,
            DiscountAmount = discountTotal,
            ShippingAmount = shippingAmount,
            TaxAmount = taxAmount,
            TotalAmount = totalAmount,
            ShippingName = request.ShippingName,
            ShippingPhone = request.ShippingPhone,
            ShippingAddress = request.ShippingAddress,
            ShippingCity = request.ShippingCity,
            ShippingPostalCode = request.ShippingPostalCode,
            ShippingCountry = request.ShippingCountry,
            Status = OrderStatus.Pending,
            PaymentStatus = PaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        foreach (var item in orderItems)
        {
            item.OrderId = order.Id;
            _context.OrderItems.Add(item);

            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == item.ProductId);
            if (product != null)
            {
                product.StockQuantity -= item.Quantity;
                product.UpdatedAt = DateTime.UtcNow;
            }
        }

        _context.CartItems.RemoveRange(activeItems);

        cart.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, new
        {
            order.Id,
            order.OrderNumber,
            order.TotalAmount,
            order.Status,
            order.PaymentStatus,
            order.CreatedAt
        });
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int id, UpdateOrderStatusRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "Status data is required." });

        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null)
            return NotFound(new { message = "Order not found." });

        order.Status = request.Status;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            order.Id,
            order.OrderNumber,
            order.Status,
            message = "Order status updated successfully."
        });
    }

    [HttpPatch("{id:int}/payment-status")]
    public async Task<IActionResult> UpdatePaymentStatus(int id, UpdatePaymentStatusRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "Payment status data is required." });

        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null)
            return NotFound(new { message = "Order not found." });

        order.PaymentStatus = request.PaymentStatus;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            order.Id,
            order.OrderNumber,
            order.PaymentStatus,
            message = "Payment status updated successfully."
        });
    }

    public class CreateOrderRequest
    {
        public int UserId { get; set; }
        public string ShippingName { get; set; } = string.Empty;
        public string ShippingPhone { get; set; } = string.Empty;
        public string ShippingAddress { get; set; } = string.Empty;
        public string ShippingCity { get; set; } = string.Empty;
        public string ShippingPostalCode { get; set; } = string.Empty;
        public string ShippingCountry { get; set; } = string.Empty;
        public decimal? ShippingAmount { get; set; }
        public decimal? TaxAmount { get; set; }
    }

    public class UpdateOrderStatusRequest
    {
        public OrderStatus Status { get; set; }
    }

    public class UpdatePaymentStatusRequest
    {
        public PaymentStatus PaymentStatus { get; set; }
    }
}