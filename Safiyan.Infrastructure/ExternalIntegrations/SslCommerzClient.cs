using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;

namespace Safiyan.Infrastructure.ExternalIntegrations;

public sealed class SslCommerzSessionRequest
{
    public string TotalAmount { get; set; } = string.Empty;
    public string Currency { get; set; } = "BDT";
    public string TranId { get; set; } = string.Empty;
    public string SuccessUrl { get; set; } = string.Empty;
    public string FailUrl { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;
    public string IpnUrl { get; set; } = string.Empty;
    public string CusName { get; set; } = string.Empty;
    public string CusEmail { get; set; } = string.Empty;
    public string CusPhone { get; set; } = string.Empty;
    public string CusAdd1 { get; set; } = string.Empty;
    public string CusCity { get; set; } = string.Empty;
    public string ProductName { get; set; } = "Order Payment";
}

public sealed class SslCommerzSessionResponse
{
    public string Status { get; set; } = string.Empty;
    public string SessionKey { get; set; } = string.Empty;
    public string GatewayPageURL { get; set; } = string.Empty;
    public string FailedReason { get; set; } = string.Empty;
}

public sealed class SslCommerzValidationResponse
{
    public string Status { get; set; } = string.Empty;
    public string TranId { get; set; } = string.Empty;
    public string ValId { get; set; } = string.Empty;
    public string Amount { get; set; } = string.Empty;
    public string CardType { get; set; } = string.Empty;
}

public sealed class SslCommerzClient(HttpClient httpClient, IConfiguration configuration)
{
    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(configuration["Integrations:SslCommerz:BaseUrl"]) &&
        !string.IsNullOrWhiteSpace(configuration["Integrations:SslCommerz:StoreId"]) &&
        !string.IsNullOrWhiteSpace(configuration["Integrations:SslCommerz:StorePassword"]);

    public bool IsValidationConfigured =>
        !string.IsNullOrWhiteSpace(configuration["Integrations:SslCommerz:ValidationUrl"]);

    /// <summary>
    /// Calls SSLCommerz's session-init API (form-encoded, per their spec) to
    /// obtain a hosted checkout GatewayPageURL for the customer to pay on.
    /// </summary>
    public async Task<SslCommerzSessionResponse> InitiateSessionAsync(
        SslCommerzSessionRequest request,
        CancellationToken cancellationToken = default)
    {
        EnsureConfigured();

        var baseUrl = configuration["Integrations:SslCommerz:BaseUrl"]!.TrimEnd('/');
        var sessionPath = configuration["Integrations:SslCommerz:SessionPath"] ?? "/gwprocess/v4/api.php";

        var form = new Dictionary<string, string>
        {
            ["store_id"] = configuration["Integrations:SslCommerz:StoreId"]!,
            ["store_passwd"] = configuration["Integrations:SslCommerz:StorePassword"]!,
            ["total_amount"] = request.TotalAmount,
            ["currency"] = request.Currency,
            ["tran_id"] = request.TranId,
            ["success_url"] = request.SuccessUrl,
            ["fail_url"] = request.FailUrl,
            ["cancel_url"] = request.CancelUrl,
            ["ipn_url"] = request.IpnUrl,
            ["cus_name"] = request.CusName,
            ["cus_email"] = request.CusEmail,
            ["cus_phone"] = request.CusPhone,
            ["cus_add1"] = request.CusAdd1,
            ["cus_city"] = request.CusCity,
            ["cus_country"] = "Bangladesh",
            ["shipping_method"] = "NO",
            ["product_name"] = request.ProductName,
            ["product_category"] = "General",
            ["product_profile"] = "general"
        };

        using var content = new FormUrlEncodedContent(form);
        using var response = await httpClient.PostAsync($"{baseUrl}{sessionPath}", content, cancellationToken);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<SslCommerzSessionResponse>(cancellationToken: cancellationToken);
        return result ?? new SslCommerzSessionResponse { Status = "FAILED", FailedReason = "Empty response from gateway." };
    }

    /// <summary>
    /// Confirms an IPN callback is genuine by asking SSLCommerz's own
    /// validator API about the val_id, instead of trusting the IPN body
    /// blindly (anyone could otherwise POST a fake "VALID" status).
    /// </summary>
    public async Task<SslCommerzValidationResponse?> ValidateTransactionAsync(
        string valId,
        CancellationToken cancellationToken = default)
    {
        if (!IsValidationConfigured)
            return null;

        var validationUrl = configuration["Integrations:SslCommerz:ValidationUrl"]!.TrimEnd('/');
        var storeId = configuration["Integrations:SslCommerz:StoreId"];
        var storePassword = configuration["Integrations:SslCommerz:StorePassword"];

        var url = $"{validationUrl}?val_id={Uri.EscapeDataString(valId)}&store_id={Uri.EscapeDataString(storeId ?? string.Empty)}&store_passwd={Uri.EscapeDataString(storePassword ?? string.Empty)}&format=json";

        using var response = await httpClient.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
            return null;

        return await response.Content.ReadFromJsonAsync<SslCommerzValidationResponse>(cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Generic JSON POST helper kept for any future SSLCommerz JSON-based
    /// endpoints (session/validation above use their required form/query
    /// formats instead).
    /// </summary>
    public async Task<TResponse?> PostAsync<TRequest, TResponse>(
        string path,
        TRequest request,
        CancellationToken cancellationToken = default)
    {
        EnsureConfigured();
        using var response = await httpClient.PostAsJsonAsync(path, request, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<TResponse>(cancellationToken);
    }

    private void EnsureConfigured()
    {
        if (!IsConfigured)
            throw new InvalidOperationException("SSLCommerz integration is not configured.");
    }
}
