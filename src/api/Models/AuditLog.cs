namespace api.Models;

// Trilha de auditoria append-only para operações sensíveis de privacidade
// (exportação e apagamento de dados), exigível sob a LGPD.
public class AuditLog : ITenantScoped
{
    public string Id { get; set; } = null!;

    // Tenant dono deste registro (FK Organization). Isola os dados por organização.
    public string TenantId { get; set; } = null!;
    public string? UserId { get; set; }
    public string Action { get; set; } = null!;
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
