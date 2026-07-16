namespace api.Models;

public class Resource : ITenantScoped
{
    public string? Id { get; set; }

    // Tenant dono deste registro (FK Organization). Isola os dados por organização.
    public string TenantId { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? Description { get; set; } = null;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
