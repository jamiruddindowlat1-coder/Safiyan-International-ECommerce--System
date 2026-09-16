using System.Text.Json.Serialization;

namespace Safiyan.Core.Entities;

public class Review
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public int UserId { get; set; }

    public int Rating { get; set; }

    public string Comment { get; set; } = string.Empty;

    public bool IsApproved { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    [JsonIgnore]
    public Product Product { get; set; } = null!;

    [JsonIgnore]
    public User User { get; set; } = null!;
}
