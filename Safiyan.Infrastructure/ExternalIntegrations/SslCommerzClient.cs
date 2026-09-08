using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;

namespace Safiyan.Infrastructure.ExternalIntegrations;

public sealed class SslCommerzClient(HttpClient httpClient, IConfiguration configuration)
{
	public bool IsConfigured =>
		!string.IsNullOrWhiteSpace(configuration["Integrations:SslCommerz:BaseUrl"]) &&
		!string.IsNullOrWhiteSpace(configuration["Integrations:SslCommerz:StoreId"]) &&
		!string.IsNullOrWhiteSpace(configuration["Integrations:SslCommerz:StorePassword"]);

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
