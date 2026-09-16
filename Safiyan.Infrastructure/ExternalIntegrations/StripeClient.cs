using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace Safiyan.Infrastructure.ExternalIntegrations;

public sealed class StripePaymentIntentResponse
{
    public string Id { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public sealed class StripeClient(HttpClient httpClient, IConfiguration configuration)
{
    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(configuration["Integrations:Stripe:BaseUrl"]) &&
        !string.IsNullOrWhiteSpace(configuration["Integrations:Stripe:SecretKey"]);

    /// <summary>
    /// Creates a Stripe PaymentIntent (form-encoded body + Bearer secret-key
    /// auth, per Stripe's REST API) and returns its client_secret for the
    /// frontend to complete payment with Stripe.js/Elements.
    /// </summary>
    public async Task<StripePaymentIntentResponse> CreatePaymentIntentAsync(
        decimal amount,
        string currency,
        string orderNumber,
        CancellationToken cancellationToken = default)
    {
        EnsureConfigured();

        var baseUrl = configuration["Integrations:Stripe:BaseUrl"]!.TrimEnd('/');
        var secretKey = configuration["Integrations:Stripe:SecretKey"]!;

        // Stripe amounts are in the smallest currency unit (e.g. poisha/cents).
        var amountInSmallestUnit = ((long)Math.Round(amount * 100m)).ToString();

        var form = new Dictionary<string, string>
        {
            ["amount"] = amountInSmallestUnit,
            ["currency"] = currency.ToLowerInvariant(),
            ["metadata[order_number]"] = orderNumber
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/v1/payment_intents")
        {
            Content = new FormUrlEncodedContent(form)
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", secretKey);

        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<StripePaymentIntentResponse>(cancellationToken: cancellationToken);
        return result ?? new StripePaymentIntentResponse { Status = "failed" };
    }

    /// <summary>
    /// Verifies a Stripe webhook's "Stripe-Signature" header against the raw
    /// request body using the configured webhook secret, so a forged webhook
    /// call can't fake a successful payment.
    /// </summary>
    public bool VerifyWebhookSignature(string payload, string? signatureHeader)
    {
        var webhookSecret = configuration["Integrations:Stripe:WebhookSecret"];
        if (string.IsNullOrWhiteSpace(webhookSecret) || string.IsNullOrWhiteSpace(signatureHeader))
            return false;

        var parts = signatureHeader.Split(',', StringSplitOptions.RemoveEmptyEntries);
        string? timestamp = null;
        var signatures = new List<string>();

        foreach (var part in parts)
        {
            var kv = part.Split('=', 2);
            if (kv.Length != 2) continue;
            if (kv[0] == "t") timestamp = kv[1];
            else if (kv[0] == "v1") signatures.Add(kv[1]);
        }

        if (timestamp == null || signatures.Count == 0)
            return false;

        var signedPayload = $"{timestamp}.{payload}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(webhookSecret));
        var computedHash = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(signedPayload))).ToLowerInvariant();

        return signatures.Any(sig => string.Equals(sig, computedHash, StringComparison.OrdinalIgnoreCase));
    }

    private void EnsureConfigured()
    {
        if (!IsConfigured)
            throw new InvalidOperationException("Stripe integration is not configured.");
    }
}
