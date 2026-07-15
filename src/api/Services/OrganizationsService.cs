using System.Text;
using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class OrganizationsService
    {
        private readonly AppDbContext _db;

        public OrganizationsService(AppDbContext db)
        {
            _db = db;
        }

        // Self-signup: cria a organização (tenant) e o seu PRIMEIRO OrgAdmin numa única
        // transação. É anônimo por natureza (o tenant ainda não existe), então o TenantId
        // do admin é setado EXPLICITAMENTE — o auto-stamp do AppDbContext lê o tenant do
        // request, que aqui não há.
        public async Task<OrganizationCreatedResponse> SignUpAsync(CreateOrganizationRequest req)
        {
            // Signup é PRÉ-tenant: checa e-mail (cross-tenant) e grava org+admin num tenant
            // que ainda não é "o do request". O escopo desliga o filtro EF e o RLS.
            using var crossTenant = _db.Tenant.EnterCrossTenant();

            // E-mail é globalmente único.
            var existing = await _db.Users
                .FirstOrDefaultAsync(u => u.Email == req.AdminEmail);
            if (existing is not null)
                throw new InvalidOperationException("E-mail já cadastrado.");

            var org = new Organization
            {
                Id = Guid.NewGuid().ToString(),
                Name = req.OrganizationName,
                Slug = await GenerateUniqueSlugAsync(req.OrganizationName),
                Status = "active",
            };

            var admin = new User
            {
                Id = Guid.NewGuid().ToString(),
                TenantId = org.Id!,
                Name = req.AdminName,
                Email = req.AdminEmail,
                Password = PasswordHasher.Hash(req.AdminPassword),
                Role = Role.OrgAdmin,
                CreatedAt = DateTime.UtcNow,
            };

            _db.Organizations.Add(org);
            _db.Users.Add(admin);
            // Uma transação: o EF ordena o INSERT de organizations antes de users (FK).
            await _db.SaveChangesAsync();

            return new OrganizationCreatedResponse
            {
                OrganizationId = org.Id!,
                OrganizationName = org.Name,
                Slug = org.Slug,
                AdminUserId = admin.Id!,
                AdminEmail = admin.Email,
            };
        }

        // Slug legível e globalmente único (organizations não é tenant-scoped, sem filtro).
        private async Task<string> GenerateUniqueSlugAsync(string name)
        {
            var baseSlug = Slugify(name);
            if (string.IsNullOrEmpty(baseSlug)) baseSlug = "org";

            var slug = baseSlug;
            var i = 1;
            while (await _db.Organizations.AnyAsync(o => o.Slug == slug))
                slug = $"{baseSlug}-{++i}";

            return slug;
        }

        private static string Slugify(string input)
        {
            var sb = new StringBuilder();
            var lastDash = false;
            foreach (var ch in input.Trim().ToLowerInvariant())
            {
                if (char.IsLetterOrDigit(ch)) { sb.Append(ch); lastDash = false; }
                else if (!lastDash && sb.Length > 0) { sb.Append('-'); lastDash = true; }
            }
            return sb.ToString().Trim('-');
        }
    }
}
