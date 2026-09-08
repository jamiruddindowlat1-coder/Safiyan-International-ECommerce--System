using Microsoft.Extensions.Logging;

namespace Safiyan.Infrastructure.Services;

public sealed class EmailService(ILogger<EmailService> logger)
{
	public Task SendAsync(string recipient, string subject, string body)
	{
		logger.LogInformation("Email queued for {Recipient}: {Subject}", recipient, subject);
		return Task.CompletedTask;
	}
}
