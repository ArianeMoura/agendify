using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    // Direitos do titular (LGPD, RNF-019): consentimento versionado, exportação
    // e apagamento por anonimização — com trilha de auditoria.
    public class PrivacyService
    {
        public const string CurrentConsentVersion = "1.0";

        private readonly AppDbContext _db;

        public PrivacyService(AppDbContext db)
        {
            _db = db;
        }

        public async Task RecordConsentAsync(string userId, string version)
        {
            _db.Consents.Add(new Consent
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                Version = version,
            });
            await _db.SaveChangesAsync();
        }

        public async Task<object?> ExportAsync(string userId)
        {
            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user is null) return null;

            var bookings = await _db.Bookings.AsNoTracking().Where(b => b.UserId == userId).ToListAsync();
            var reviews = await _db.Reviews.AsNoTracking().Where(r => r.UserId == userId).ToListAsync();
            var consents = await _db.Consents.AsNoTracking().Where(c => c.UserId == userId).ToListAsync();

            AddAudit(userId, "data_exported", $"bookings={bookings.Count};reviews={reviews.Count}");
            await _db.SaveChangesAsync();

            return new
            {
                user = new { user.Id, user.Name, user.Email, Role = user.Role.ToString(), user.CreatedAt },
                bookings,
                reviews,
                consents,
            };
        }

        // Apagamento por ANONIMIZAÇÃO (irreversível): a linha do usuário vira
        // tombstone (PII sobrescrita), mas as reservas permanecem para preservar
        // relatórios de ocupação agregados. Revoga sessões e limpa PII textual.
        public async Task<bool> AnonymizeAsync(string userId)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user is null) return false;
            if (user.AnonymizedAt is not null) return true; // idempotente

            user.Name = "[usuário removido]";
            user.Email = $"anon+{user.Id}@anonimizado.invalid";
            user.Password = string.Empty;
            user.AnonymizedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

            var reviews = await _db.Reviews.Where(r => r.UserId == userId).ToListAsync();
            foreach (var r in reviews) r.Comment = null; // remove texto livre (pode conter PII)

            var tokens = await _db.RefreshTokens.Where(t => t.UserId == userId && t.RevokedAt == null).ToListAsync();
            foreach (var t in tokens) t.RevokedAt = DateTime.UtcNow;

            AddAudit(userId, "account_anonymized", null);
            await _db.SaveChangesAsync();
            return true;
        }

        private void AddAudit(string userId, string action, string? details)
        {
            _db.AuditLogs.Add(new AuditLog
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                Action = action,
                Details = details,
            });
        }
    }
}
