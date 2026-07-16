using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace api.Models;

public class User : ITenantScoped
{
    // PK textual (uuid armazenado como texto) — mantém o contrato de Id string
    // consumido por controllers, DTOs e claims do JWT sem churn.
    public string? Id { get; set; }

    // Tenant dono deste registro (FK Organization). Isola os dados por organização.
    public string TenantId { get; set; } = null!;

    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    // [JsonIgnore] é rede de segurança: nenhuma resposta deve carregar o hash, e a
    // entidade não é bindada de corpo nenhum (os requests usam DTOs próprios). Sem
    // isto, qualquer projeção que embuta User volta a vazar a credencial pela API.
    [Required]
    [JsonIgnore]
    public string Password { get; set; } = string.Empty;

    [Required]
    public Role Role { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Marca contas anonimizadas via direito de apagamento (LGPD). A linha vira
    // tombstone (PII sobrescrita) mas preserva o vínculo agregado das reservas.
    public DateTime? AnonymizedAt { get; set; }
}

// Papéis do multi-tenancy, em hierarquia:
//  PlatformOwner — a dona da plataforma; enxerga todos os tenants (bypass do filtro).
//  OrgAdmin      — administra o próprio tenant (o antigo "Administrator").
//  Member        — usuário final do app dentro do tenant (o antigo "Common").
public enum Role
{
    PlatformOwner,
    OrgAdmin,
    Member
}
