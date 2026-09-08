using Safiyan.Core.Entities;

namespace Safiyan.Core.Interfaces;

public interface IProductService
{
	Task<IReadOnlyList<Product>> GetProductsAsync(CancellationToken cancellationToken = default);
	Task<Product?> GetProductAsync(int id, CancellationToken cancellationToken = default);
}
