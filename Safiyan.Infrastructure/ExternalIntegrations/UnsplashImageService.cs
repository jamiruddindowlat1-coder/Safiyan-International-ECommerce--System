using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;

namespace Safiyan.Infrastructure.ExternalIntegrations;

/// <summary>
/// Looks up a free stock photo on Unsplash that matches a given search term
/// (typically a category name) and returns a direct, hotlinkable image URL.
///
/// Setup:
///   1. Get a free Access Key from https://unsplash.com/oauth/applications
///   2. Put it in appsettings.json under "Unsplash:AccessKey"
///   3. If the key is missing/empty, this service safely no-ops (returns null)
///      instead of throwing, so category create/update still works without it.
/// </summary>
public class UnsplashImageService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    private const string BaseUrl = "https://api.unsplash.com";

    public UnsplashImageService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;

        if (_httpClient.BaseAddress == null)
            _httpClient.BaseAddress = new Uri(BaseUrl);
    }

    /// <summary>
    /// Searches Unsplash for a photo matching <paramref name="query"/> (e.g. a
    /// category name like "Electronics") and returns the first result's
    /// regular-size image URL, or null if no key is configured, no results
    /// are found, or the request fails for any reason.
    /// </summary>
    public async Task<string?> FindImageUrlAsync(string query, CancellationToken cancellationToken = default)
    {
        var accessKey = _configuration["Unsplash:AccessKey"];

        if (string.IsNullOrWhiteSpace(accessKey))
        {
            // No key configured yet — fail quietly so the rest of the
            // category workflow (create/update) is unaffected.
            return null;
        }

        if (string.IsNullOrWhiteSpace(query))
            return null;

        try
        {
            var url = $"/search/photos?query={Uri.EscapeDataString(query)}&per_page=1&orientation=squarish";

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("Authorization", $"Client-ID {accessKey}");

            using var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
                return null;

            var result = await response.Content.ReadFromJsonAsync<UnsplashSearchResponse>(
                cancellationToken: cancellationToken);

            var firstPhoto = result?.Results?.FirstOrDefault();
            return firstPhoto?.Urls?.Regular;
        }
        catch
        {
            // Network errors, rate limiting, malformed responses, etc.
            // Image lookup is a "nice to have" — never let it break the
            // category create/update flow.
            return null;
        }
    }

    // ----- Minimal DTOs for the subset of the Unsplash response we use -----

    private sealed class UnsplashSearchResponse
    {
        public List<UnsplashPhoto>? Results { get; set; }
    }

    private sealed class UnsplashPhoto
    {
        public UnsplashPhotoUrls? Urls { get; set; }
    }

    private sealed class UnsplashPhotoUrls
    {
        public string? Regular { get; set; }
    }
}


