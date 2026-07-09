using System.Reflection;
using api.Models;
using api.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace api.Data
{
    // Fonte de verdade em PostgreSQL. O invariante de double-booking (RN-01)
    // é garantido no banco por uma exclusion constraint sobre um range tstzrange
    // gerado — ver a migração InitialCreate, que injeta o SQL bruto que o EF
    // não modela nativamente (coluna GENERATED + EXCLUDE USING gist).
    public class AppDbContext : DbContext
    {
        // Tenant do request atual. Usado para carimbar tenant_id nas escritas
        // (SaveChanges) e para o global query filter de leitura. Sempre injetado
        // (DI em runtime; TenantContext explícito no design-time e nos testes).
        private readonly ITenantContext _tenant;

        public AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenant)
            : base(options)
        {
            _tenant = tenant;
        }

        // Tenant do request, exposto para os serviços abrirem escopos cross-tenant
        // (EnterCrossTenant) em operações pré-tenant (login, signup, aceite de convite).
        public ITenantContext Tenant => _tenant;

        public DbSet<Organization> Organizations => Set<Organization>();
        public DbSet<User> Users => Set<User>();
        public DbSet<Space> Spaces => Set<Space>();
        public DbSet<Resource> Resources => Set<Resource>();
        public DbSet<Booking> Bookings => Set<Booking>();
        public DbSet<IdempotencyKey> IdempotencyKeys => Set<IdempotencyKey>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<Consent> Consents => Set<Consent>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<Review> Reviews => Set<Review>();
        public DbSet<Invitation> Invitations => Set<Invitation>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Raiz do multi-tenancy. Toda tabela de dados referencia organizations
            // por tenant_id (configurado no loop ao final deste método).
            modelBuilder.Entity<Organization>(e =>
            {
                e.ToTable("organizations");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id");
                e.Property(x => x.Name).HasColumnName("name");
                e.Property(x => x.Slug).HasColumnName("slug");
                e.Property(x => x.Status).HasColumnName("status");
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
                e.HasIndex(x => x.Slug).IsUnique();
            });

            modelBuilder.Entity<User>(e =>
            {
                e.ToTable("users");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id");
                e.Property(x => x.Name).HasColumnName("name");
                e.Property(x => x.Email).HasColumnName("email");
                e.Property(x => x.Password).HasColumnName("password");
                e.Property(x => x.Role).HasColumnName("role").HasConversion<string>();
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
                e.Property(x => x.AnonymizedAt).HasColumnName("anonymized_at");
                e.HasIndex(x => x.Email).IsUnique();
            });

            modelBuilder.Entity<Resource>(e =>
            {
                e.ToTable("resources");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id");
                e.Property(x => x.Name).HasColumnName("name");
                e.Property(x => x.Description).HasColumnName("description");
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            });

            modelBuilder.Entity<Space>(e =>
            {
                e.ToTable("spaces");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id");
                e.Property(x => x.Name).HasColumnName("name");
                e.Property(x => x.Description).HasColumnName("description");
                e.Property(x => x.Capacity).HasColumnName("capacity");
                e.Property(x => x.ImageUrl).HasColumnName("image_url");
                // Lista de strings -> text[] nativo do Postgres.
                e.Property(x => x.AvailableHours).HasColumnName("available_hours");
                e.Property(x => x.Availability).HasColumnName("availability");
                e.Property(x => x.IsAllDayBooking).HasColumnName("is_all_day_booking");
                e.Property(x => x.AllDayStartTime).HasColumnName("all_day_start_time");
                e.Property(x => x.AllDayEndTime).HasColumnName("all_day_end_time");
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
                // Coleção de recursos embutida como jsonb (preserva o shape do documento).
                e.OwnsMany(x => x.Resources, nb =>
                {
                    nb.ToJson("resources");
                    nb.Ignore(sr => sr.Resource);
                });
            });

            modelBuilder.Entity<Booking>(e =>
            {
                e.ToTable("bookings");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id");
                e.Property(x => x.UserId).HasColumnName("user_id");
                e.Property(x => x.SpaceId).HasColumnName("space_id");
                e.Property(x => x.StartDateTime).HasColumnName("start_date_time");
                e.Property(x => x.EndDateTime).HasColumnName("end_date_time");
                e.Property(x => x.Status).HasColumnName("status");
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
                e.HasIndex(x => x.SpaceId);
                e.HasIndex(x => x.UserId);
                // A coluna gerada `during` (tstzrange) e a exclusion constraint
                // `no_overlap` são criadas via SQL bruto na migração InitialCreate.
            });

            modelBuilder.Entity<IdempotencyKey>(e =>
            {
                e.ToTable("idempotency_keys");
                e.HasKey(x => new { x.Key, x.UserId });
                e.Property(x => x.Key).HasColumnName("key");
                e.Property(x => x.UserId).HasColumnName("user_id");
                e.Property(x => x.ResponseStatus).HasColumnName("response_status");
                e.Property(x => x.ResponseBody).HasColumnName("response_body");
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
            });

            modelBuilder.Entity<RefreshToken>(e =>
            {
                e.ToTable("refresh_tokens");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id");
                e.Property(x => x.UserId).HasColumnName("user_id");
                e.Property(x => x.TokenHash).HasColumnName("token_hash");
                e.Property(x => x.ExpiresAt).HasColumnName("expires_at");
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.Property(x => x.RevokedAt).HasColumnName("revoked_at");
                e.Ignore(x => x.IsActive);
                e.HasIndex(x => x.TokenHash).IsUnique();
                e.HasIndex(x => x.UserId);
            });

            modelBuilder.Entity<Consent>(e =>
            {
                e.ToTable("consents");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id");
                e.Property(x => x.UserId).HasColumnName("user_id");
                e.Property(x => x.Version).HasColumnName("version");
                e.Property(x => x.AcceptedAt).HasColumnName("accepted_at");
                e.HasIndex(x => x.UserId);
            });

            modelBuilder.Entity<AuditLog>(e =>
            {
                e.ToTable("audit_logs");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id");
                e.Property(x => x.UserId).HasColumnName("user_id");
                e.Property(x => x.Action).HasColumnName("action");
                e.Property(x => x.Details).HasColumnName("details");
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.HasIndex(x => x.UserId);
            });

            modelBuilder.Entity<Review>(e =>
            {
                e.ToTable("reviews");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id");
                e.Property(x => x.UserId).HasColumnName("user_id");
                e.Property(x => x.SpaceId).HasColumnName("space_id");
                e.Property(x => x.Rating).HasColumnName("rating");
                e.Property(x => x.Comment).HasColumnName("comment");
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.HasIndex(x => x.SpaceId);
                e.HasIndex(x => x.UserId);
            });

            modelBuilder.Entity<Invitation>(e =>
            {
                e.ToTable("invitations");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id");
                e.Property(x => x.Email).HasColumnName("email");
                e.Property(x => x.Role).HasColumnName("role").HasConversion<string>();
                e.Property(x => x.TokenHash).HasColumnName("token_hash");
                e.Property(x => x.ExpiresAt).HasColumnName("expires_at");
                e.Property(x => x.AcceptedAt).HasColumnName("accepted_at");
                e.Property(x => x.InvitedByUserId).HasColumnName("invited_by_user_id");
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.Ignore(x => x.IsPending);
                e.HasIndex(x => x.TokenHash).IsUnique();
            });

            // Configuração comum de tenancy aplicada a TODA entidade ITenantScoped,
            // varrendo o modelo — em vez de repetir em cada bloco acima. Cada uma
            // ganha: coluna snake_case tenant_id, índice (para o filtro por tenant da
            // Fase 2) e uma FK real para organizations. A FK é uma exceção consciente
            // à convenção "sem FK no banco": tenant_id é a espinha do isolamento e
            // merece integridade referencial garantida pelo Postgres. OnDelete
            // Restrict impede apagar uma organização que ainda tenha dados.
            foreach (var entityType in modelBuilder.Model.GetEntityTypes()
                         .Where(t => typeof(ITenantScoped).IsAssignableFrom(t.ClrType)))
            {
                modelBuilder.Entity(entityType.ClrType, b =>
                {
                    b.Property(nameof(ITenantScoped.TenantId)).HasColumnName("tenant_id");
                    b.HasIndex(nameof(ITenantScoped.TenantId));
                    b.HasOne(typeof(Organization))
                        .WithMany()
                        .HasForeignKey(nameof(ITenantScoped.TenantId))
                        .OnDelete(DeleteBehavior.Restrict);
                });

                // Global query filter: toda LEITURA da entidade ganha, automaticamente,
                // um WHERE tenant_id = <tenant do request>. É a rede de segurança do
                // isolamento — mesmo que um serviço esqueça de filtrar, o EF filtra.
                // Aplicado via método genérico (o HasQueryFilter tipado exige o T).
                ApplyTenantFilterMethod
                    .MakeGenericMethod(entityType.ClrType)
                    .Invoke(this, new object[] { modelBuilder });
            }
        }

        private static readonly MethodInfo ApplyTenantFilterMethod =
            typeof(AppDbContext).GetMethod(nameof(ApplyTenantFilter),
                BindingFlags.NonPublic | BindingFlags.Instance)!;

        // O filtro referencia _tenant (membro de instância do contexto); o EF Core
        // reavalia esse acesso a CADA query, lendo o tenant atual — por isso funciona
        // mesmo com o modelo em cache. BypassTenantFilter=true (Platform Owner) desliga
        // o filtro e faz o contexto enxergar todos os tenants.
        private void ApplyTenantFilter<TEntity>(ModelBuilder modelBuilder)
            where TEntity : class, ITenantScoped
        {
            modelBuilder.Entity<TEntity>().HasQueryFilter(
                e => _tenant.BypassTenantFilter || e.TenantId == _tenant.CurrentTenantId);
        }

        // Auto-stamp de tenant: antes de persistir, toda entidade ITenantScoped
        // adicionada OU modificada SEM tenant_id herda o tenant do request atual. Cobrir
        // Modified é essencial para o padrão "substitui a linha inteira" (ex.:
        // BookingsService.Update reconstrói o Booking sem tenant) — sem isso o UPDATE
        // tentaria gravar tenant_id NULL. Remove a chance de um serviço esquecer o tenant
        // (segurança por padrão) e mantém a coluna NOT NULL satisfeita. TenantId já
        // preenchido é respeitado (útil para os testes fixarem o tenant e, na Fase 2,
        // impede trocar o tenant de uma linha ao editá-la).
        public override int SaveChanges(bool acceptAllChangesOnSuccess)
        {
            StampTenant();
            return base.SaveChanges(acceptAllChangesOnSuccess);
        }

        public override Task<int> SaveChangesAsync(
            bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
        {
            StampTenant();
            return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }

        private void StampTenant()
        {
            var tenantId = _tenant.CurrentTenantId;
            if (string.IsNullOrEmpty(tenantId)) return;

            foreach (var entry in ChangeTracker.Entries<ITenantScoped>())
            {
                if ((entry.State == EntityState.Added || entry.State == EntityState.Modified)
                    && string.IsNullOrEmpty(entry.Entity.TenantId))
                    entry.Entity.TenantId = tenantId;
            }
        }
    }
}
