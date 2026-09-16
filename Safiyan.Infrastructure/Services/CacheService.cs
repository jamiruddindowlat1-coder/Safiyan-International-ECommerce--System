using Microsoft.Extensions.Caching.Memory;

namespace Safiyan.Infrastructure.Services;

public sealed class CacheService(IMemoryCache cache)
{
	public T? Get<T>(string key) => cache.TryGetValue(key, out T? value) ? value : default;

	public void Set<T>(string key, T value, TimeSpan? duration = null)
	{
		cache.Set(key, value, duration ?? TimeSpan.FromMinutes(10));
	}

	public void Remove(string key) => cache.Remove(key);
}
