using System.Collections.Concurrent;

namespace Safiyan.Api.Middleware;

public sealed class RateLimitingMiddleware
{
	private readonly RequestDelegate _next;
	private readonly ConcurrentDictionary<string, RequestWindow> _windows = new();
	private const int RequestLimit = 120;
	private static readonly TimeSpan Window = TimeSpan.FromMinutes(1);

	public RateLimitingMiddleware(RequestDelegate next)
	{
		_next = next;
	}

	public async Task InvokeAsync(HttpContext context)
	{
		var key = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
		var now = DateTimeOffset.UtcNow;
		var window = _windows.AddOrUpdate(key, _ => new RequestWindow(now), (_, current) =>
		{
			if (now - current.StartedAt >= Window)
				return new RequestWindow(now);

			current.Count++;
			return current;
		});

		if (window.Count > RequestLimit)
		{
			context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
			await context.Response.WriteAsJsonAsync(new { message = "Too many requests. Please try again later." });
			return;
		}

		await _next(context);
	}

	private sealed class RequestWindow(DateTimeOffset startedAt)
	{
		public DateTimeOffset StartedAt { get; } = startedAt;
		public int Count { get; set; } = 1;
	}
}
