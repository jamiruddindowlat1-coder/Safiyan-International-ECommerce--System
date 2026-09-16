using System.Text;
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
public class PaymentController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly SslCommerzClient _sslCommerzClient;
    private readonly StripeClient _stripeClient;
    private readonly IConfiguration _configuration;

    public PaymentController(
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
    // GET PAYMENT BY ORDER
    // ============================================================

    [Authorize]
    [HttpGet("{orderId:int}")]
    public async Task<ActionResult<object>> GetPayment(int orderId)
    {
        var payment = await _context.Payments
            .AsNoTracking()
            .Where(p => p.OrderId == orderId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.OrderId,
                p.TransactionId,
                p.PaymentMethod,
                p.Amount,
                p.Status,
                p.GatewayResponse,
                p.CreatedAt,
                p.PaidAt
            })
            .FirstOrDefaultAsync();

        if (payment == null)
        {
            return NotFound(new
            {
                message = "Payment not found."
            });
        }

        return Ok(payment);
    }

    // ============================================================
    // SSL COMMERZ SUCCESS
    // ============================================================

    [AllowAnonymous]
    [HttpPost("sslcommerz/success")]
    public async Task<IActionResult> SslCommerzSuccess()
    {
        return await ProcessSslCommerzCallbackAsync(
            "SUCCESS");
    }

    // Some gateway/browser flows may use GET.
    [AllowAnonymous]
    [HttpGet("sslcommerz/success")]
    public async Task<IActionResult> SslCommerzSuccessGet()
    {
        return await ProcessSslCommerzCallbackAsync(
            "SUCCESS");
    }

    // ============================================================
    // SSL COMMERZ FAIL
    // ============================================================

    [AllowAnonymous]
    [HttpPost("sslcommerz/fail")]
    public async Task<IActionResult> SslCommerzFail()
    {
        return await ProcessSslCommerzCallbackAsync(
            "FAILED");
    }

    [AllowAnonymous]
    [HttpGet("sslcommerz/fail")]
    public async Task<IActionResult> SslCommerzFailGet()
    {
        return await ProcessSslCommerzCallbackAsync(
            "FAILED");
    }

    // ============================================================
    // SSL COMMERZ CANCEL
    // ============================================================

    [AllowAnonymous]
    [HttpPost("sslcommerz/cancel")]
    public async Task<IActionResult> SslCommerzCancel()
    {
        return await ProcessSslCommerzCallbackAsync(
            "CANCELLED");
    }

    [AllowAnonymous]
    [HttpGet("sslcommerz/cancel")]
    public async Task<IActionResult> SslCommerzCancelGet()
    {
        return await ProcessSslCommerzCallbackAsync(
            "CANCELLED");
    }

    // ============================================================
    // SSL COMMERZ IPN
    // ============================================================

    [AllowAnonymous]
    [HttpPost("sslcommerz/ipn")]
    public async Task<IActionResult> SslCommerzIpn()
    {
        return await ProcessSslCommerzCallbackAsync(
            "IPN");
    }

    // ============================================================
    // PROCESS SSL COMMERZ CALLBACK
    // ============================================================

    private async Task<IActionResult> ProcessSslCommerzCallbackAsync(
        string callbackType)
    {
        try
        {
            var form = await Request.ReadFormAsync();

            var tranId =
                GetFormValue(form, "tran_id");

            var valId =
                GetFormValue(form, "val_id");

            var status =
                GetFormValue(form, "status");

            var amount =
                GetFormValue(form, "amount");

            var bankTranId =
                GetFormValue(form, "bank_tran_id");

            var cardType =
                GetFormValue(form, "card_type");

            var storeAmount =
                GetFormValue(form, "store_amount");

            if (string.IsNullOrWhiteSpace(tranId))
            {
                return BadRequest(new
                {
                    message =
                        "SSLCommerz transaction ID is missing."
                });
            }

            // ----------------------------------------------------
            // Find payment
            // ----------------------------------------------------

            var payment = await _context.Payments
                .Include(p => p.Order)
                .FirstOrDefaultAsync(
                    p => p.TransactionId == tranId ||
                         p.Order.OrderNumber == tranId);

            if (payment == null)
            {
                return NotFound(new
                {
                    message =
                        "Payment transaction not found.",
                    transactionId = tranId
                });
            }

            // ----------------------------------------------------
            // Duplicate callback protection
            // ----------------------------------------------------

            if (payment.Status == PaymentStatus.Paid)
            {
                return RedirectToFrontend(
                    "success",
                    payment.OrderId,
                    payment.Order.OrderNumber);
            }

            // ----------------------------------------------------
            // Save gateway response
            // ----------------------------------------------------

            payment.GatewayResponse =
                BuildSslGatewayResponse(
                    callbackType,
                    status,
                    valId,
                    amount,
                    bankTranId,
                    cardType,
                    storeAmount);

            // ----------------------------------------------------
            // Fail / cancel
            // ----------------------------------------------------

            if (callbackType == "FAILED" ||
                callbackType == "CANCELLED")
            {
                payment.Status =
                    PaymentStatus.Failed;

                payment.Order.PaymentStatus =
                    PaymentStatus.Failed;

                payment.Order.UpdatedAt =
                    DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return RedirectToFrontend(
                    "failed",
                    payment.OrderId,
                    payment.Order.OrderNumber);
            }

            // ----------------------------------------------------
            // SUCCESS / IPN validation
            // ----------------------------------------------------

            if (string.IsNullOrWhiteSpace(valId))
            {
                payment.Status =
                    PaymentStatus.Failed;

                payment.Order.PaymentStatus =
                    PaymentStatus.Failed;

                payment.Order.UpdatedAt =
                    DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return RedirectToFrontend(
                    "failed",
                    payment.OrderId,
                    payment.Order.OrderNumber);
            }

            // ----------------------------------------------------
            // Validate transaction with SSLCommerz
            // ----------------------------------------------------

            if (!_sslCommerzClient.IsValidationConfigured)
            {
                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    new
                    {
                        message =
                            "SSLCommerz validation URL is not configured."
                    });
            }

            var validation =
                await _sslCommerzClient
                    .ValidateTransactionAsync(valId);

            if (validation == null)
            {
                payment.Status =
                    PaymentStatus.Failed;

                payment.Order.PaymentStatus =
                    PaymentStatus.Failed;

                payment.Order.UpdatedAt =
                    DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return RedirectToFrontend(
                    "failed",
                    payment.OrderId,
                    payment.Order.OrderNumber);
            }

            // ----------------------------------------------------
            // Validate transaction ID
            // ----------------------------------------------------

            if (!string.IsNullOrWhiteSpace(validation.TranId) &&
                !string.Equals(
                    validation.TranId,
                    payment.Order.OrderNumber,
                    StringComparison.OrdinalIgnoreCase))
            {
                payment.Status =
                    PaymentStatus.Failed;

                payment.Order.PaymentStatus =
                    PaymentStatus.Failed;

                payment.Order.UpdatedAt =
                    DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return RedirectToFrontend(
                    "failed",
                    payment.OrderId,
                    payment.Order.OrderNumber);
            }

            // ----------------------------------------------------
            // Validate amount
            // ----------------------------------------------------

            if (!TryParseAmount(
                    validation.Amount,
                    out var validatedAmount))
            {
                payment.Status =
                    PaymentStatus.Failed;

                payment.Order.PaymentStatus =
                    PaymentStatus.Failed;

                payment.Order.UpdatedAt =
                    DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return RedirectToFrontend(
                    "failed",
                    payment.OrderId,
                    payment.Order.OrderNumber);
            }

            if (Math.Abs(
                    validatedAmount -
                    payment.Amount) > 0.01m)
            {
                payment.Status =
                    PaymentStatus.Failed;

                payment.Order.PaymentStatus =
                    PaymentStatus.Failed;

                payment.Order.UpdatedAt =
                    DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return RedirectToFrontend(
                    "failed",
                    payment.OrderId,
                    payment.Order.OrderNumber);
            }

            // ----------------------------------------------------
            // Validate SSLCommerz response status
            // ----------------------------------------------------

            var validationStatus =
                validation.Status?.Trim();

            if (!string.Equals(
                    validationStatus,
                    "VALID",
                    StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(
                    validationStatus,
                    "VALIDATED",
                    StringComparison.OrdinalIgnoreCase))
            {
                payment.Status =
                    PaymentStatus.Failed;

                payment.Order.PaymentStatus =
                    PaymentStatus.Failed;

                payment.Order.UpdatedAt =
                    DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return RedirectToFrontend(
                    "failed",
                    payment.OrderId,
                    payment.Order.OrderNumber);
            }

            // ----------------------------------------------------
            // Mark payment paid
            // ----------------------------------------------------

            await MarkPaymentPaidAsync(
                payment,
                validation.ValId,
                validation.CardType);

            return RedirectToFrontend(
                "success",
                payment.OrderId,
                payment.Order.OrderNumber);
        }
        catch (Exception ex)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message =
                        "Unable to process SSLCommerz callback.",
                    error = ex.Message
                });
        }
    }

    // ============================================================
    // STRIPE WEBHOOK
    // ============================================================

    [AllowAnonymous]
    [HttpPost("stripe/webhook")]
    public async Task<IActionResult> StripeWebhook()
    {
        Request.EnableBuffering();

        string payload;

        using (var reader = new StreamReader(
                   Request.Body,
                   Encoding.UTF8,
                   detectEncodingFromByteOrderMarks: false,
                   leaveOpen: true))
        {
            payload = await reader.ReadToEndAsync();

            Request.Body.Position = 0;
        }

        var signature =
            Request.Headers["Stripe-Signature"]
                .FirstOrDefault();

        if (!_stripeClient.VerifyWebhookSignature(
                payload,
                signature))
        {
            return Unauthorized(new
            {
                message =
                    "Invalid Stripe webhook signature."
            });
        }

        try
        {
            using var document =
                System.Text.Json.JsonDocument.Parse(
                    payload);

            var root =
                document.RootElement;

            var eventType =
                root.TryGetProperty(
                    "type",
                    out var typeProperty)
                    ? typeProperty.GetString()
                    : null;

            if (string.IsNullOrWhiteSpace(eventType))
            {
                return BadRequest(new
                {
                    message =
                        "Stripe event type is missing."
                });
            }

            switch (eventType)
            {
                case "payment_intent.succeeded":
                    await HandleStripePaymentSucceededAsync(
                        root);
                    break;

                case "payment_intent.payment_failed":
                    await HandleStripePaymentFailedAsync(
                        root);
                    break;

                case "payment_intent.canceled":
                    await HandleStripePaymentCanceledAsync(
                        root);
                    break;

                default:
                    // Other Stripe events are safely ignored.
                    break;
            }

            return Ok(new
            {
                received = true
            });
        }
        catch (Exception ex)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message =
                        "Unable to process Stripe webhook.",
                    error = ex.Message
                });
        }
    }

    // ============================================================
    // STRIPE PAYMENT SUCCEEDED
    // ============================================================

    private async Task HandleStripePaymentSucceededAsync(
        System.Text.Json.JsonElement root)
    {
        if (!root.TryGetProperty(
                "data",
                out var data))
            return;

        if (!data.TryGetProperty(
                "object",
                out var paymentIntent))
            return;

        var paymentIntentId =
            paymentIntent.TryGetProperty(
                "id",
                out var idProperty)
                ? idProperty.GetString()
                : null;

        if (string.IsNullOrWhiteSpace(
                paymentIntentId))
            return;

        var payment = await _context.Payments
            .Include(p => p.Order)
            .FirstOrDefaultAsync(
                p => p.TransactionId ==
                     paymentIntentId);

        if (payment == null)
            return;

        if (payment.Status ==
            PaymentStatus.Paid)
        {
            return;
        }

        await MarkPaymentPaidAsync(
            payment,
            paymentIntentId,
            "Stripe");
    }

    // ============================================================
    // STRIPE PAYMENT FAILED
    // ============================================================

    private async Task HandleStripePaymentFailedAsync(
        System.Text.Json.JsonElement root)
    {
        if (!root.TryGetProperty(
                "data",
                out var data))
            return;

        if (!data.TryGetProperty(
                "object",
                out var paymentIntent))
            return;

        var paymentIntentId =
            paymentIntent.TryGetProperty(
                "id",
                out var idProperty)
                ? idProperty.GetString()
                : null;

        if (string.IsNullOrWhiteSpace(
                paymentIntentId))
            return;

        var payment = await _context.Payments
            .Include(p => p.Order)
            .FirstOrDefaultAsync(
                p => p.TransactionId ==
                     paymentIntentId);

        if (payment == null)
            return;

        if (payment.Status ==
            PaymentStatus.Paid)
        {
            return;
        }

        payment.Status =
            PaymentStatus.Failed;

        payment.Order.PaymentStatus =
            PaymentStatus.Failed;

        payment.Order.UpdatedAt =
            DateTime.UtcNow;

        payment.GatewayResponse =
            "Stripe payment_intent.payment_failed";

        await _context.SaveChangesAsync();
    }

    // ============================================================
    // STRIPE PAYMENT CANCELED
    // ============================================================

    private async Task HandleStripePaymentCanceledAsync(
        System.Text.Json.JsonElement root)
    {
        if (!root.TryGetProperty(
                "data",
                out var data))
            return;

        if (!data.TryGetProperty(
                "object",
                out var paymentIntent))
            return;

        var paymentIntentId =
            paymentIntent.TryGetProperty(
                "id",
                out var idProperty)
                ? idProperty.GetString()
                : null;

        if (string.IsNullOrWhiteSpace(
                paymentIntentId))
            return;

        var payment = await _context.Payments
            .Include(p => p.Order)
            .FirstOrDefaultAsync(
                p => p.TransactionId ==
                     paymentIntentId);

        if (payment == null)
            return;

        if (payment.Status ==
            PaymentStatus.Paid)
        {
            return;
        }

        payment.Status =
            PaymentStatus.Failed;

        payment.Order.PaymentStatus =
            PaymentStatus.Failed;

        payment.Order.UpdatedAt =
            DateTime.UtcNow;

        payment.GatewayResponse =
            "Stripe payment_intent.canceled";

        await _context.SaveChangesAsync();
    }

    // ============================================================
    // MARK PAYMENT PAID
    // ============================================================

    private async Task MarkPaymentPaidAsync(
        Payment payment,
        string? gatewayTransactionId,
        string? gatewayName)
    {
        if (payment.Status ==
            PaymentStatus.Paid)
        {
            return;
        }

        payment.Status =
            PaymentStatus.Paid;

        payment.PaidAt =
            DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(
                gatewayTransactionId))
        {
            payment.GatewayResponse =
                $"{gatewayName ?? "Gateway"} transaction validated. " +
                $"Transaction={gatewayTransactionId}";
        }

        payment.Order.PaymentStatus =
                PaymentStatus.Paid;

            payment.Order.Status =
                OrderStatus.Confirmed;

            payment.Order.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    // ============================================================
    // FRONTEND REDIRECT
    // ============================================================

    private IActionResult RedirectToFrontend(
        string status,
        int orderId,
        string orderNumber)
    {
        var frontendBaseUrl =
            _configuration[
                "Integrations:Shipping:FrontendBaseUrl"];

        if (string.IsNullOrWhiteSpace(
                frontendBaseUrl))
        {
            frontendBaseUrl =
                "http://localhost:5173";
        }

        frontendBaseUrl =
            frontendBaseUrl.TrimEnd('/');

        var encodedOrderNumber =
            Uri.EscapeDataString(
                orderNumber ?? string.Empty);

        var encodedStatus =
            Uri.EscapeDataString(
                status ?? string.Empty);

        var url =
            $"{frontendBaseUrl}/payment-result" +
            $"?status={encodedStatus}" +
            $"&orderId={orderId}" +
            $"&orderNumber={encodedOrderNumber}";

        return Redirect(url);
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private static string GetFormValue(
        IFormCollection form,
        string key)
    {
        return form.TryGetValue(
                key,
                out var value)
            ? value.ToString()
            : string.Empty;
    }

    private static bool TryParseAmount(
        string? value,
        out decimal amount)
    {
        return decimal.TryParse(
            value,
            System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture,
            out amount);
    }

    private static string BuildSslGatewayResponse(
        string callbackType,
        string status,
        string valId,
        string amount,
        string bankTranId,
        string cardType,
        string storeAmount)
    {
        return
            $"CallbackType={callbackType}; " +
            $"Status={status}; " +
            $"ValId={valId}; " +
            $"Amount={amount}; " +
            $"StoreAmount={storeAmount}; " +
            $"BankTranId={bankTranId}; " +
            $"CardType={cardType}";
    }
}


