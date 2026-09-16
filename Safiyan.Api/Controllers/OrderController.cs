using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Core.Enums;
using Safiyan.Infrastructure.Data;
using Safiyan.Infrastructure.ExternalIntegrations;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrderController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly SslCommerzClient _sslCommerzClient;
    private readonly StripeClient _stripeClient;
    private readonly IConfiguration _configuration;

    public OrderController(
        ApplicationDbContext context,
        SslCommerzClient sslCommerzClient,
        StripeClient stripeClient,
        IConfiguration configuration)
    {
        _context = context;
        _sslCommerzClient = sslCommerzClient;
        _stripeClient = stripeClient;
        _configuration = configuration;
    }

    // ============================================================
    // GET ALL ORDERS
    // ============================================================

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

    // ============================================================
    // GET SINGLE ORDER
    // ============================================================

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

    // ============================================================
    // GET USER ORDERS
    // ============================================================

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

    // ============================================================
    // CREATE ORDER
    // ============================================================

    [HttpPost]
    public async Task<ActionResult<object>> CreateOrder(CreateOrderRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "Order data is required." });

        if (request.UserId <= 0)
            return BadRequest(new { message = "Valid UserId is required." });

        // --------------------------------------------------------
        // Validate payment method
        // --------------------------------------------------------

        var paymentMethod = NormalizePaymentMethod(request.PaymentMethod);

        if (paymentMethod == null)
        {
            return BadRequest(new
            {
                message = "Invalid PaymentMethod. Allowed values: COD, SSLCommerz, Stripe."
            });
        }

        // --------------------------------------------------------
        // Check online payment configuration BEFORE modifying
        // stock/cart/order.
        // --------------------------------------------------------

        if (paymentMethod == "SSLCOMMERZ" && !_sslCommerzClient.IsConfigured)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                message = "SSLCommerz payment gateway is not configured."
            });
        }

        if (paymentMethod == "STRIPE" && !_stripeClient.IsConfigured)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                message = "Stripe payment gateway is not configured."
            });
        }

        // --------------------------------------------------------
        // Validate user
        // --------------------------------------------------------

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId);

        if (user == null)
            return NotFound(new { message = "User not found." });

        // --------------------------------------------------------
        // Load cart
        // --------------------------------------------------------

        var cart = await _context.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == request.UserId);

        if (cart == null || cart.Items.Count == 0)
            return BadRequest(new { message = "Cart is empty." });

        // --------------------------------------------------------
        // Prepare order items
        // --------------------------------------------------------

        var orderItems = new List<OrderItem>();
        decimal subtotal = 0m;
        decimal discountTotal = 0m;

        // Remove inactive products from cart.
        var inactiveItems = cart.Items
            .Where(i => i.Product == null || !i.Product.IsActive)
            .ToList();

        if (inactiveItems.Any())
        {
            _context.CartItems.RemoveRange(inactiveItems);
            await _context.SaveChangesAsync();
        }

        // Reload cart after removing invalid items.
        cart = await _context.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == request.UserId);

        if (cart == null)
            return BadRequest(new { message = "Cart is empty." });

        var activeItems = cart.Items
            .Where(i => i.Product != null && i.Product.IsActive)
            .ToList();

        if (!activeItems.Any())
            return BadRequest(new { message = "Cart is empty." });

        // --------------------------------------------------------
        // Validate stock + calculate subtotal
        // --------------------------------------------------------

        foreach (var item in activeItems)
        {
            if (item.Product == null)
                continue;

            if (item.Quantity <= 0)
            {
                return BadRequest(new
                {
                    message = $"Invalid quantity for {item.Product.Name}."
                });
            }

            if (item.Quantity > item.Product.StockQuantity)
            {
                return BadRequest(new
                {
                    message =
                        $"Only {item.Product.StockQuantity} unit(s) left for {item.Product.Name}."
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

        // ========================================================
        // COUPON VALIDATION
        // ========================================================

        Coupon? appliedCoupon = null;

        if (!string.IsNullOrWhiteSpace(request.CouponCode))
        {
            var code = request.CouponCode.Trim();

            var coupon = await _context.Coupons
                .FirstOrDefaultAsync(c =>
                    c.Code.ToLower() == code.ToLower());

            if (coupon == null)
                return BadRequest(new
                {
                    message = "Coupon code not found."
                });

            if (!coupon.IsActive)
                return BadRequest(new
                {
                    message = "This coupon is no longer active."
                });

            var now = DateTime.UtcNow;

            if (now < coupon.StartDate)
                return BadRequest(new
                {
                    message = "This coupon is not active yet."
                });

            if (now > coupon.EndDate)
                return BadRequest(new
                {
                    message = "This coupon has expired."
                });

            if (coupon.UsageLimit > 0 &&
                coupon.UsedCount >= coupon.UsageLimit)
            {
                return BadRequest(new
                {
                    message = "This coupon has reached its usage limit."
                });
            }

            if (coupon.MinimumOrderAmount.HasValue &&
                subtotal < coupon.MinimumOrderAmount.Value)
            {
                return BadRequest(new
                {
                    message =
                        $"This coupon requires a minimum order of ৳{coupon.MinimumOrderAmount.Value}."
                });
            }

            var rawDiscount = Math.Round(
                subtotal * (coupon.DiscountPercentage / 100m),
                2);

            discountTotal = coupon.MaximumDiscountAmount.HasValue
                ? Math.Min(
                    rawDiscount,
                    coupon.MaximumDiscountAmount.Value)
                : rawDiscount;

            appliedCoupon = coupon;
        }

        // ========================================================
        // TOTAL
        // ========================================================

        var shippingAmount = request.ShippingAmount ?? 0m;
        var taxAmount = request.TaxAmount ?? 0m;

        var totalAmount =
            subtotal +
            shippingAmount +
            taxAmount -
            discountTotal;

        if (totalAmount < 0m)
            totalAmount = 0m;

        // ========================================================
        // CREATE ORDER
        // ========================================================

        var order = new Order
        {
            UserId = request.UserId,

            OrderNumber =
                $"SO-{DateTime.UtcNow:yyyyMMddHHmmss}-" +
                $"{Guid.NewGuid().ToString("N")[..6].ToUpper()}",

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

        // ========================================================
        // ADD ORDER ITEMS + REDUCE STOCK
        // ========================================================

        foreach (var item in orderItems)
        {
            item.OrderId = order.Id;

            _context.OrderItems.Add(item);

            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == item.ProductId);

            if (product != null)
            {
                product.StockQuantity -= item.Quantity;
                product.UpdatedAt = DateTime.UtcNow;
            }
        }

        // --------------------------------------------------------
        // Clear cart
        // --------------------------------------------------------

        _context.CartItems.RemoveRange(activeItems);

        cart.UpdatedAt = DateTime.UtcNow;

        // --------------------------------------------------------
        // Consume coupon
        // --------------------------------------------------------

        if (appliedCoupon != null)
        {
            appliedCoupon.UsedCount += 1;
        }

        await _context.SaveChangesAsync();

        // ========================================================
        // CREATE PAYMENT RECORD
        // ========================================================

        var payment = new Payment
        {
            OrderId = order.Id,
            TransactionId = order.OrderNumber,
            PaymentMethod = paymentMethod,
            Amount = totalAmount,
            Status = PaymentStatus.Pending,
            GatewayResponse = string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);

        await _context.SaveChangesAsync();

        // ========================================================
        // COD
        // ========================================================

        if (paymentMethod == "COD")
        {
            return CreatedAtAction(
                nameof(GetOrder),
                new { id = order.Id },
                new
                {
                    success = true,
                    paymentMethod = "COD",

                    order = new
                    {
                        order.Id,
                        order.OrderNumber,
                        order.SubTotal,
                        order.DiscountAmount,
                        order.ShippingAmount,
                        order.TaxAmount,
                        order.TotalAmount,
                        order.Status,
                        order.PaymentStatus,
                        order.CreatedAt
                    },

                    payment = new
                    {
                        payment.Id,
                        payment.PaymentMethod,
                        payment.Status,
                        payment.Amount
                    }
                });
        }

        // ========================================================
        // SSL COMMERZ
        // ========================================================

        if (paymentMethod == "SSLCOMMERZ")
        {
            try
            {
                var callbackBaseUrl =
                    _configuration["Integrations:SslCommerz:CallbackBaseUrl"];

                if (string.IsNullOrWhiteSpace(callbackBaseUrl))
                {
                    await MarkPaymentFailedAsync(
                        payment,
                        "SSLCommerz CallbackBaseUrl is not configured.");

                    return StatusCode(
                        StatusCodes.Status503ServiceUnavailable,
                        new
                        {
                            message =
                                "SSLCommerz CallbackBaseUrl is not configured.",
                            orderId = order.Id
                        });
                }

                callbackBaseUrl = callbackBaseUrl.TrimEnd('/');

                var sslRequest = new SslCommerzSessionRequest
                {
                    TotalAmount = totalAmount.ToString("0.00"),
                    Currency = "BDT",
                    TranId = order.OrderNumber,

                    SuccessUrl =
                        $"{callbackBaseUrl}/sslcommerz/success",

                    FailUrl =
                        $"{callbackBaseUrl}/sslcommerz/fail",

                    CancelUrl =
                        $"{callbackBaseUrl}/sslcommerz/cancel",

                    IpnUrl =
                        $"{callbackBaseUrl}/sslcommerz/ipn",

                    CusName = string.IsNullOrWhiteSpace(
                        request.ShippingName)
                        ? user.FullName
                        : request.ShippingName,

                    CusEmail = user.Email ?? string.Empty,

                    CusPhone = request.ShippingPhone,

                    CusAdd1 = request.ShippingAddress,

                    CusCity = request.ShippingCity,

                    ProductName = "SIES Order Payment"
                };

                var sslResponse =
                    await _sslCommerzClient.InitiateSessionAsync(
                        sslRequest);

                payment.GatewayResponse =
                    $"Status={sslResponse.Status}; " +
                    $"SessionKey={sslResponse.SessionKey}; " +
                    $"GatewayPageURL={sslResponse.GatewayPageURL}; " +
                    $"FailedReason={sslResponse.FailedReason}";

                payment.TransactionId = order.OrderNumber;

                await _context.SaveChangesAsync();

                if (!string.Equals(
                        sslResponse.Status,
                        "SUCCESS",
                        StringComparison.OrdinalIgnoreCase) ||
                    string.IsNullOrWhiteSpace(
                        sslResponse.GatewayPageURL))
                {
                    payment.Status = PaymentStatus.Failed;

                    await _context.SaveChangesAsync();

                    return StatusCode(
                        StatusCodes.Status502BadGateway,
                        new
                        {
                            message =
                                "SSLCommerz payment session could not be created.",

                            orderId = order.Id,
                            orderNumber = order.OrderNumber,

                            gatewayStatus =
                                sslResponse.Status,

                            failedReason =
                                sslResponse.FailedReason
                        });
                }

                return CreatedAtAction(
                    nameof(GetOrder),
                    new { id = order.Id },
                    new
                    {
                        success = true,
                        paymentMethod = "SSLCommerz",

                        order = new
                        {
                            order.Id,
                            order.OrderNumber,
                            order.SubTotal,
                            order.DiscountAmount,
                            order.ShippingAmount,
                            order.TaxAmount,
                            order.TotalAmount,
                            order.Status,
                            order.PaymentStatus,
                            order.CreatedAt
                        },

                        payment = new
                        {
                            payment.Id,
                            payment.PaymentMethod,
                            payment.Status,
                            payment.Amount,

                            gatewayPageUrl =
                                sslResponse.GatewayPageURL,

                            sessionKey =
                                sslResponse.SessionKey
                        }
                    });
            }
            catch (Exception ex)
            {
                await MarkPaymentFailedAsync(
                    payment,
                    ex.Message);

                return StatusCode(
                    StatusCodes.Status502BadGateway,
                    new
                    {
                        message =
                            "Unable to initiate SSLCommerz payment.",

                        orderId = order.Id,
                        orderNumber = order.OrderNumber,

                        error = ex.Message
                    });
            }
        }

        // ========================================================
        // STRIPE
        // ========================================================

        if (paymentMethod == "STRIPE")
        {
            try
            {
                var stripeResponse =
                    await _stripeClient.CreatePaymentIntentAsync(
                        totalAmount,
                        "bdt",
                        order.OrderNumber);

                payment.TransactionId =
                    string.IsNullOrWhiteSpace(stripeResponse.Id)
                        ? order.OrderNumber
                        : stripeResponse.Id;

                payment.GatewayResponse =
                    $"PaymentIntentId={stripeResponse.Id}; " +
                    $"Status={stripeResponse.Status}";

                await _context.SaveChangesAsync();

                if (string.IsNullOrWhiteSpace(
                        stripeResponse.ClientSecret))
                {
                    payment.Status = PaymentStatus.Failed;

                    await _context.SaveChangesAsync();

                    return StatusCode(
                        StatusCodes.Status502BadGateway,
                        new
                        {
                            message =
                                "Stripe PaymentIntent did not return a client secret.",

                            orderId = order.Id,
                            orderNumber = order.OrderNumber
                        });
                }

                return CreatedAtAction(
                    nameof(GetOrder),
                    new { id = order.Id },
                    new
                    {
                        success = true,
                        paymentMethod = "Stripe",

                        order = new
                        {
                            order.Id,
                            order.OrderNumber,
                            order.SubTotal,
                            order.DiscountAmount,
                            order.ShippingAmount,
                            order.TaxAmount,
                            order.TotalAmount,
                            order.Status,
                            order.PaymentStatus,
                            order.CreatedAt
                        },

                        payment = new
                        {
                            payment.Id,
                            payment.PaymentMethod,
                            payment.Status,
                            payment.Amount,

                            paymentIntentId =
                                stripeResponse.Id,

                            clientSecret =
                                stripeResponse.ClientSecret,

                            stripeStatus =
                                stripeResponse.Status
                        }
                    });
            }
            catch (Exception ex)
            {
                await MarkPaymentFailedAsync(
                    payment,
                    ex.Message);

                return StatusCode(
                    StatusCodes.Status502BadGateway,
                    new
                    {
                        message =
                            "Unable to initiate Stripe payment.",

                        orderId = order.Id,
                        orderNumber = order.OrderNumber,

                        error = ex.Message
                    });
            }
        }

        return BadRequest(new
        {
            message = "Unsupported payment method."
        });
    }

    // ============================================================
    // UPDATE ORDER STATUS
    // ============================================================

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateOrderStatus(
        int id,
        UpdateOrderStatusRequest request)
    {
        if (request == null)
            return BadRequest(new
            {
                message = "Status data is required."
            });

        var order = await _context.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Category)
            .Include(o => o.Items)
                .ThenInclude(i => i.Vendor)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
            return NotFound(new
            {
                message = "Order not found."
            });

        if (order.Status == request.Status)
        {
            return BadRequest(new
            {
                message =
                    $"Order is already {order.Status}."
            });
        }

        if (!AllowedTransitions.TryGetValue(
                order.Status,
                out var allowedNext) ||
            !allowedNext.Contains(request.Status))
        {
            var allowedList =
                AllowedTransitions.TryGetValue(
                    order.Status,
                    out var next) &&
                next.Length > 0
                    ? string.Join(", ", next)
                    : "none — this is a final status";

            return BadRequest(new
            {
                message =
                    $"Cannot move an order from {order.Status} to {request.Status}. " +
                    $"Allowed next status: {allowedList}."
            });
        }

        var wasAlreadyDelivered =
            order.Status == OrderStatus.Delivered;

        var isNowCancelledOrReturned =
            request.Status == OrderStatus.Cancelled ||
            request.Status == OrderStatus.Returned;

        order.Status = request.Status;
        order.UpdatedAt = DateTime.UtcNow;

        // --------------------------------------------------------
        // Restore stock on cancellation/return
        // --------------------------------------------------------

        if (isNowCancelledOrReturned)
        {
            await RestoreStockForOrderAsync(order);
        }

        // --------------------------------------------------------
        // Settle commission when delivered
        // --------------------------------------------------------

        if (request.Status == OrderStatus.Delivered &&
            !wasAlreadyDelivered)
        {
            await SettleCommissionForOrderAsync(order);
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            order.Id,
            order.OrderNumber,
            order.Status,

            message =
                "Order status updated successfully."
        });
    }

    // ============================================================
    // RESTORE STOCK
    // ============================================================

    private async Task RestoreStockForOrderAsync(Order order)
    {
        foreach (var item in order.Items)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(
                    p => p.Id == item.ProductId);

            if (product != null)
            {
                product.StockQuantity += item.Quantity;
                product.UpdatedAt = DateTime.UtcNow;
            }
        }
    }

    // ============================================================
    // SETTLE COMMISSION
    // ============================================================

    private async Task SettleCommissionForOrderAsync(
        Order order)
    {
        decimal totalCommissionForOrder = 0m;

        foreach (var item in order.Items)
        {
            if (item.CommissionSettled)
                continue;

            var categoryRate =
                item.Product?.Category?.CommissionRate ?? 0m;

            var rate =
                item.Vendor?.CommissionRateOverride
                ?? categoryRate;

            var commissionAmount =
                Math.Round(
                    item.TotalPrice * (rate / 100m),
                    2);

            var vendorEarning =
                item.TotalPrice - commissionAmount;

            item.CommissionRateApplied = rate;
            item.CommissionAmount = commissionAmount;
            item.VendorEarning = vendorEarning;
            item.CommissionSettled = true;

            totalCommissionForOrder += commissionAmount;

            var vendor = await _context.Vendors
                .FirstOrDefaultAsync(
                    v => v.Id == item.VendorId);

            if (vendor != null)
            {
                vendor.PayableBalance += vendorEarning;
                vendor.UpdatedAt = DateTime.UtcNow;
            }
        }

        if (totalCommissionForOrder > 0m)
        {
            _context.AccountEntries.Add(
                new AccountEntry
                {
                    EntryDate = DateTime.UtcNow.Date,
                    Type = "Income",
                    Description =
                        $"Marketplace commission — Order {order.OrderNumber}",
                    Amount = totalCommissionForOrder,
                    Reference = order.OrderNumber,
                    CreatedAt = DateTime.UtcNow
                });
        }
    }

    // ============================================================
    // UPDATE PAYMENT STATUS
    // ============================================================

    [HttpPatch("{id:int}/payment-status")]
    public async Task<IActionResult> UpdatePaymentStatus(
        int id,
        UpdatePaymentStatusRequest request)
    {
        if (request == null)
        {
            return BadRequest(new
            {
                message =
                    "Payment status data is required."
            });
        }

        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return NotFound(new
            {
                message = "Order not found."
            });
        }

        order.PaymentStatus =
            request.PaymentStatus;

        order.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            order.Id,
            order.OrderNumber,
            order.PaymentStatus,

            message =
                "Payment status updated successfully."
        });
    }

    // ============================================================
    // MARK PAYMENT FAILED
    // ============================================================

    private async Task MarkPaymentFailedAsync(
        Payment payment,
        string reason)
    {
        payment.Status = PaymentStatus.Failed;

        payment.GatewayResponse =
            string.IsNullOrWhiteSpace(reason)
                ? "Payment gateway initiation failed."
                : reason;

        payment.Order.PaymentStatus =
            PaymentStatus.Failed;

        payment.Order.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    // ============================================================
    // NORMALIZE PAYMENT METHOD
    // ============================================================

    private static string? NormalizePaymentMethod(
        string? paymentMethod)
    {
        if (string.IsNullOrWhiteSpace(paymentMethod))
            return null;

        var value =
            paymentMethod
                .Trim()
                .Replace("-", "")
                .Replace("_", "")
                .Replace(" ", "")
                .ToUpperInvariant();

        return value switch
        {
            "COD" => "COD",

            "SSLCOMMERZ" => "SSLCOMMERZ",

            "STRIPE" => "STRIPE",

            _ => null
        };
    }

    // ============================================================
    // ORDER STATUS TRANSITIONS
    // ============================================================

    private static readonly
        Dictionary<OrderStatus, OrderStatus[]> AllowedTransitions = new()
        {
            [OrderStatus.Pending] =
                new[]
                {
                    OrderStatus.Confirmed,
                    OrderStatus.Cancelled
                },

            [OrderStatus.Confirmed] =
                new[]
                {
                    OrderStatus.Processing,
                    OrderStatus.Cancelled
                },

            [OrderStatus.Processing] =
                new[]
                {
                    OrderStatus.Shipped,
                    OrderStatus.Cancelled
                },

            [OrderStatus.Shipped] =
                new[]
                {
                    OrderStatus.Delivered,
                    OrderStatus.Returned
                },

            [OrderStatus.Delivered] =
                new[]
                {
                    OrderStatus.Returned
                },

            [OrderStatus.Cancelled] =
                Array.Empty<OrderStatus>(),

            [OrderStatus.Returned] =
                Array.Empty<OrderStatus>()
        };

    // ============================================================
    // REQUEST MODELS
    // ============================================================

    public class CreateOrderRequest
    {
        public int UserId { get; set; }

        public string ShippingName { get; set; } =
            string.Empty;

        public string ShippingPhone { get; set; } =
            string.Empty;

        public string ShippingAddress { get; set; } =
            string.Empty;

        public string ShippingCity { get; set; } =
            string.Empty;

        public string ShippingPostalCode { get; set; } =
            string.Empty;

        public string ShippingCountry { get; set; } =
            string.Empty;

        public decimal? ShippingAmount { get; set; }

        public decimal? TaxAmount { get; set; }

        public string? CouponCode { get; set; }

        // COD | SSLCommerz | Stripe
        public string PaymentMethod { get; set; } =
            "COD";
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

