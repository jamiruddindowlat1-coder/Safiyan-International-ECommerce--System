namespace Safiyan.Core.Entities;

public class Coupon
{
    public int Id { get; set; }

    public string Code { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal DiscountPercentage { get; set; }

    public decimal? MaximumDiscountAmount { get; set; }

    public decimal? MinimumOrderAmount { get; set; }

    public int UsageLimit { get; set; }

    public int UsedCount { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
