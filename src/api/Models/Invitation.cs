namespace api.Models;

// Convite para um usuário entrar em um tenant (RF de onboarding). Um OrgAdmin
// convida por e-mail informando o papel; guardamos apenas o HASH do token (o valor
// bruto vai só para o convidado, como nos refresh tokens). O aceite cria o usuário
// no tenant do convite e define a senha.
public class Invitation : ITenantScoped
{
    public string? Id { get; set; }

    // Tenant que está convidando (FK Organization). Isola o convite por organização.
    public string TenantId { get; set; } = null!;

    public string Email { get; set; } = null!;

    // Papel que o convidado assumirá ao aceitar (Member ou OrgAdmin; nunca PlatformOwner).
    public Role Role { get; set; }

    public string TokenHash { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    public DateTime? AcceptedAt { get; set; }

    public string? InvitedByUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Convite ainda válido: não aceito e não expirado.
    public bool IsPending => AcceptedAt is null && DateTime.UtcNow < ExpiresAt;
}
