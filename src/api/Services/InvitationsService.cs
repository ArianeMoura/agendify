using System.Security.Cryptography;
using System.Text;
using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class InvitationsService
    {
        private readonly AppDbContext _db;
        private readonly IEmailSender _emailSender;
        private static readonly TimeSpan Ttl = TimeSpan.FromDays(7);

        public InvitationsService(AppDbContext db, IEmailSender emailSender)
        {
            _db = db;
            _emailSender = emailSender;
        }

        // OrgAdmin convida alguém para o SEU tenant. O tenant_id do convite é carimbado
        // pelo auto-stamp (tenant do request). Devolve o token BRUTO (só o hash é
        // persistido) para repasse manual — ainda não há serviço de e-mail.
        public async Task<InviteCreatedResponse> CreateAsync(string email, Role role, string? invitedByUserId)
        {
            if (role == Role.PlatformOwner)
                throw new InvalidOperationException("Não é possível convidar como PlatformOwner.");

            var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
            var expiresAt = DateTime.UtcNow.Add(Ttl);

            _db.Invitations.Add(new Invitation
            {
                Id = Guid.NewGuid().ToString(),
                Email = email,
                Role = role,
                TokenHash = Hash(rawToken),
                ExpiresAt = expiresAt,
                InvitedByUserId = invitedByUserId,
                // TenantId preenchido pelo auto-stamp a partir do ITenantContext.
            });

            _db.AuditLogs.Add(new AuditLog
            {
                Id = Guid.NewGuid().ToString(),
                UserId = invitedByUserId,
                Action = "invitation_created",
                Details = $"email={email};role={role}",
            });

            await _db.SaveChangesAsync();

            // Entrega best-effort: monta o deep link do app e manda ao sender (hoje, logs).
            // O token base64 pode conter +//= — precisa de URL-encode. Se o envio falhar,
            // o convite JÁ está salvo e o token volta na resposta (fallback do painel).
            var acceptLink = $"agendify://accept-invite?token={Uri.EscapeDataString(rawToken)}";
            try
            {
                await _emailSender.SendInvitationAsync(email, acceptLink, expiresAt);
            }
            catch
            {
                // Não falha o convite se a entrega do e-mail falhar.
            }

            return new InviteCreatedResponse { Token = rawToken, ExpiresAt = expiresAt };
        }

        // Aceite ANÔNIMO: valida o token (busca por hash, cross-tenant), cria o usuário no
        // tenant do convite (TenantId explícito) e marca como aceito. Retorna null se o
        // convite não existe, expirou ou já foi usado.
        public async Task<User?> AcceptAsync(AcceptInvitationRequest req)
        {
            // Aceite é PRÉ-tenant: acha o convite (cross-tenant) e cria o usuário no tenant
            // dele. O escopo desliga o filtro EF e o RLS por toda a operação.
            using var crossTenant = _db.Tenant.EnterCrossTenant();

            var hash = Hash(req.Token);
            var invitation = await _db.Invitations
                .FirstOrDefaultAsync(i => i.TokenHash == hash);

            if (invitation is null || !invitation.IsPending)
                return null;

            var existing = await _db.Users
                .FirstOrDefaultAsync(u => u.Email == invitation.Email);
            if (existing is not null)
                throw new InvalidOperationException("E-mail já cadastrado.");

            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                TenantId = invitation.TenantId,
                Name = req.Name,
                Email = invitation.Email,
                Password = PasswordHasher.Hash(req.Password),
                Role = invitation.Role,
                CreatedAt = DateTime.UtcNow,
            };

            invitation.AcceptedAt = DateTime.UtcNow;
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return user;
        }

        private static string Hash(string token) =>
            Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    }
}
