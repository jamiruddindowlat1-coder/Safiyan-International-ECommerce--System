using Microsoft.Extensions.Logging;

namespace Safiyan.Infrastructure.Services;

public sealed class SmsService(ILogger<SmsService> logger)
{
	public Task SendAsync(string phoneNumber, string message)
	{
		logger.LogInformation("SMS queued for {PhoneNumber}: {Message}", phoneNumber, message);
		return Task.CompletedTask;
	}
}
