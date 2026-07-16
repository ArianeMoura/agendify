namespace api.Models;

public class Booking : ITenantScoped
{
    public string? Id { get; set; }

    // Tenant dono deste registro (FK Organization). Isola os dados por organização.
    public string TenantId { get; set; } = null!;

    public string? UserId { get; set; }

    public string? SpaceId { get; set; }

    public DateTime StartDateTime { get; set; } = DateTime.UtcNow;

    public DateTime EndDateTime { get; set; } = DateTime.UtcNow;

    // Estado da reserva. A exclusion constraint no Postgres só arbitra
    // sobreposição entre reservas 'confirmed'; cancelar libera o slot.
    public string Status { get; set; } = "confirmed";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
