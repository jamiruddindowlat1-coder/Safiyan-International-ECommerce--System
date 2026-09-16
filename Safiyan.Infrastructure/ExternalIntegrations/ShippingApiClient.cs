using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;

namespace Safiyan.Infrastructure.ExternalIntegrations;

public sealed class ShippingApiClient(HttpClient httpClient, IConfiguration configuration)
{
	public bool IsConfigured => !string.IsNullOrWhiteSpace(configuration["Integrations:Shipping:BaseUrl"]);

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

	public async Task<TResponse?> GetAsync<TResponse>(string path, CancellationToken cancellationToken = default)
	{
		EnsureConfigured();
		using var response = await httpClient.GetAsync(path, cancellationToken);
		response.EnsureSuccessStatusCode();
		return await response.Content.ReadFromJsonAsync<TResponse>(cancellationToken);
	}

	private void EnsureConfigured()
	{
		if (!IsConfigured)
			throw new InvalidOperationException("Shipping integration is not configured.");
	}
}
