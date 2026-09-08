using Safiyan.Core.Entities;

namespace Safiyan.Core.Interfaces;

public interface IOrderService
{
	Task<IReadOnlyList<Order>> GetOrdersAsync(CancellationToken cancellationToken = default);
	Task<Order?> GetOrderAsync(int id, CancellationToken cancellationToken = default);
}
