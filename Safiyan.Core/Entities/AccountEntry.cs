namespace Safiyan.Core.Entities;

public class AccountEntry
{
    public int Id { get; set; }

    public DateTime EntryDate { get; set; } = DateTime.UtcNow;

    public string Type { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string Reference { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}