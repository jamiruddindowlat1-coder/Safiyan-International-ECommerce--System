namespace Safiyan.Infrastructure.Services;

public sealed class FileStorageService(string contentRootPath)
{
	public async Task<string> SaveAsync(Stream content, string fileName, CancellationToken cancellationToken = default)
	{
		var folder = Path.Combine(contentRootPath, "uploads");
		Directory.CreateDirectory(folder);
		var safeName = $"{Guid.NewGuid():N}{Path.GetExtension(fileName)}";
		var path = Path.Combine(folder, safeName);
		await using var output = File.Create(path);
		await content.CopyToAsync(output, cancellationToken);
		return $"/uploads/{safeName}";
	}
}
