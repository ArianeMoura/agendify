using System.Security.Cryptography;
using System.Text;
using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace api.Services;

// Recuperação de senha (RF-003). Segue o desenho do InvitationsService — token aleatório,
// só o hash persistido, expiração e uso único — com o TTL curto que o SECURITY.md exige
// para reset (minutos, não os 7 dias do convite).
public class PasswordResetService
{
    private readonly AppDbContext _db;
    private readonly IEmailSender _emailSender;
    private readonly AppSettings _app;
    private readonly ILogger<PasswordResetService> _logger;

    // Curto de propósito: é uma credencial de troca de senha viajando por e-mail.
    private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(30);

    public PasswordResetService(
        AppDbContext db, IEmailSender emailSender, IOptions<AppSettings> app,
        ILogger<PasswordResetService> logger)
    {
        _db = db;
        _emailSender = emailSender;
        _app = app.Value;
        _logger = logger;
    }

    // Pedido ANÔNIMO de redefinição. Não devolve nada sobre o e-mail existir ou não: quem
    // chama responde sempre o mesmo 200, para o endpoint não virar um oráculo de cadastro.
    public async Task RequestAsync(string email, CancellationToken ct = default)
    {
        // Pré-tenant: só temos o e-mail, então a busca precisa cruzar tenants.
        using var crossTenant = _db.Tenant.EnterCrossTenant();

        var user = await _db.Users.FirstOrDefaultAsync(
            u => u.Email == email && u.AnonymizedAt == null, ct);

        if (user is null)
        {
            // Silêncio proposital: e-mail desconhecido segue o mesmo caminho de tempo e
            // resposta de um conhecido, só sem enviar nada.
            _logger.LogInformation("Pedido de reset para e-mail não cadastrado.");
            return;
        }

        // Invalida pedidos anteriores ainda válidos: o link mais recente é o único que vale.
        var pending = await _db.PasswordResetTokens
            .Where(t => t.UserId == user.Id && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow)
            .ToListAsync(ct);
        foreach (var old in pending)
            old.UsedAt = DateTime.UtcNow;

        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var expiresAt = DateTime.UtcNow.Add(Ttl);

        _db.PasswordResetTokens.Add(new PasswordResetToken
        {
            Id = Guid.NewGuid().ToString(),
            // Explícito: o fluxo é anônimo, então o auto-stamp não tem tenant para carimbar
            // (mesmo motivo do RefreshToken no AuthService).
            TenantId = user.TenantId,
            UserId = user.Id!,
            TokenHash = Hash(rawToken),
            ExpiresAt = expiresAt,
        });

        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = user.TenantId,
            UserId = user.Id,
            Action = "password_reset_requested",
        });

        await _db.SaveChangesAsync(ct);

        // Best-effort, como no convite: o token já está salvo; falha de entrega não deve
        // estourar um erro para quem pediu (e ainda revelaria que o e-mail existe).
        var resetLink = $"{_app.BaseUrl!.TrimEnd('/')}/reset-password?token={Uri.EscapeDataString(rawToken)}";
        try
        {
            await _emailSender.SendPasswordResetAsync(user.Email, resetLink, expiresAt, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao enviar o e-mail de redefinição de senha.");
        }
    }

    // Troca a senha usando o token. Retorna false se o token não existe, expirou ou já
    // foi usado — sem distinguir os casos para quem chama.
    public async Task<bool> ResetAsync(string token, string newPassword, CancellationToken ct = default)
    {
        using var crossTenant = _db.Tenant.EnterCrossTenant();

        var hash = Hash(token);
        var reset = await _db.PasswordResetTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (reset is null || !reset.IsPending)
            return false;

        var user = await _db.Users.FirstOrDefaultAsync(
            u => u.Id == reset.UserId && u.AnonymizedAt == null, ct);
        if (user is null)
            return false;

        user.Password = PasswordHasher.Hash(newPassword);
        user.UpdatedAt = DateTime.UtcNow;
        reset.UsedAt = DateTime.UtcNow;

        // Trocar a senha derruba as sessões abertas: se a conta foi comprometida, o
        // atacante não continua logado pelo refresh token que já tinha.
        var sessions = await _db.RefreshTokens
            .Where(r => r.UserId == user.Id && r.RevokedAt == null)
            .ToListAsync(ct);
        foreach (var session in sessions)
            session.RevokedAt = DateTime.UtcNow;

        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = user.TenantId,
            UserId = user.Id,
            Action = "password_reset_completed",
        });

        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
