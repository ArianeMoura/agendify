namespace api.Models;

// Token de redefinição de senha (RF-003). Espelha o Invitation, com duas diferenças que o
// SECURITY.md exige para reset: TTL curto (minutos, não dias) e invalidação após o uso.
public class PasswordResetToken : ITenantScoped
{
    public string? Id { get; set; }

    // Tenant do usuário dono do token. O fluxo de "esqueci a senha" é anônimo, então o
    // auto-stamp não tem tenant para carimbar — é setado explicitamente a partir do
    // user.TenantId, como o AuthService faz com o RefreshToken.
    public string TenantId { get; set; } = null!;

    public string UserId { get; set; } = null!;

    // Só o hash é persistido; o token bruto existe apenas no link do e-mail.
    public string TokenHash { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    // Uso único: preenchido quando a senha é de fato trocada.
    public DateTime? UsedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsPending => UsedAt is null && DateTime.UtcNow < ExpiresAt;
}
