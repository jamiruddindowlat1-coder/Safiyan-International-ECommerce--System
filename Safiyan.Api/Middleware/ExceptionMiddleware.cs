using System.Text.Json;
using Safiyan.Core.Exceptions;

namespace Safiyan.Api.Middleware;

public sealed class ExceptionMiddleware
{
	private readonly RequestDelegate _next;
	private readonly ILogger<ExceptionMiddleware> _logger;

	public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
	{
		_next = next;
		_logger = logger;
	}

	public async Task InvokeAsync(HttpContext context)
	{
		try
		{
			await _next(context);
		}
		catch (Exception exception)
		{
			_logger.LogError(exception, "Unhandled request exception.");
			context.Response.StatusCode = exception switch
			{
				ValidationException => StatusCodes.Status400BadRequest,
				UnauthorizedException => StatusCodes.Status401Unauthorized,
				NotFoundException => StatusCodes.Status404NotFound,
				ConflictException => StatusCodes.Status409Conflict,
				_ => StatusCodes.Status500InternalServerError
			};
			context.Response.ContentType = "application/json";
			await context.Response.WriteAsync(JsonSerializer.Serialize(new
			{
				message = exception is DomainException
					? exception.Message
					: "An unexpected server error occurred."
			}));
		}
	}
}
