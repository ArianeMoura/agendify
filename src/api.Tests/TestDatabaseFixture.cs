using api.Data;
using api.Models;
using api.Tenancy;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NUnit.Framework;
using Testcontainers.PostgreSql;

namespace api.Tests
{
    // SetUpFixture no namespace-raiz api.Tests: cobre todos os testes do assembly.
    // Sobe um Postgres efêmero (Testcontainers) uma única vez e aplica as migrações
    // — incluindo a exclusion constraint. Assim a suíte roda de verdade no CI, sem
    // o antigo Assert.Ignore que a deixava vazia. Se AGENDIFY_TEST_POSTGRES estiver
    // definida, usa esse banco em vez de subir container.
    [SetUpFixture]
    public class TestDatabaseFixture
    {
        public static string ConnectionString { get; private set; } = null!;
        private static PostgreSqlContainer? _container;

        private const string AppRole = "agendify_app";
        private const string AppPassword = "agendify_app_pw";

        [OneTimeSetUp]
        public async Task GlobalSetup()
        {
            string adminConn;
            var external = Environment.GetEnvironmentVariable("AGENDIFY_TEST_POSTGRES");
            if (!string.IsNullOrWhiteSpace(external))
            {
                adminConn = external;
            }
            else
            {
                _container = new PostgreSqlBuilder()
                    .WithImage("postgres:16")
                    // O gate de concorrência abre 100 conexões simultâneas como papel
                    // NÃO-superuser (agendify_app); com max_connections=100 padrão e slots
                    // reservados a superuser, o papel comum não alcança 100. Sobe o limite.
                    .WithCommand("-c", "max_connections=200")
                    .Build();
                await _container.StartAsync();
                adminConn = _container.GetConnectionString();
            }

            // Migra como admin/owner (cria schema + habilita RLS).
            var adminOptions = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(adminConn).Options;
            await using (var db = new AppDbContext(adminOptions, new TenantContext()))
                await db.Database.MigrateAsync();

            // Cria um papel de aplicação NÃO-superuser e concede DML. Isso é essencial:
            // SUPERUSER IGNORA RLS (até com FORCE). Em produção (Neon) o app conecta como
            // um papel comum; aqui replicamos isso para o RLS ser de fato exercido.
            await using (var admin = new NpgsqlConnection(adminConn))
            {
                await admin.OpenAsync();
                await using var cmd = admin.CreateCommand();
                cmd.CommandText = $@"
                    DO $$ BEGIN
                      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '{AppRole}') THEN
                        CREATE ROLE {AppRole} LOGIN PASSWORD '{AppPassword}' NOSUPERUSER;
                      END IF;
                    END $$;
                    GRANT USAGE ON SCHEMA public TO {AppRole};
                    GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public TO {AppRole};";
                await cmd.ExecuteNonQueryAsync();
            }

            // Os contextos de teste conectam como o papel de aplicação (RLS aplica).
            // CommandTimeout generoso: o gate de 100 reservas simultâneas serializa na
            // exclusion constraint, e o overhead do RLS/set_config alonga a cauda da fila
            // — sem folga, os últimos da fila batem no timeout padrão de 30s.
            ConnectionString = new NpgsqlConnectionStringBuilder(adminConn)
            {
                Username = AppRole,
                Password = AppPassword,
                CommandTimeout = 120,
            }.ConnectionString;
        }

        [OneTimeTearDown]
        public async Task GlobalTeardown()
        {
            if (_container is not null)
                await _container.DisposeAsync();
        }

        // Por padrão o contexto opera dentro da organização "default" — o mesmo tenant
        // em que a migração faz o backfill. Assim o auto-stamp preenche tenant_id nas
        // escritas e os testes não precisam setar tenant à mão. A Fase 2 usará o
        // parâmetro para simular tenants distintos (A e B) no teste de isolamento.
        public static AppDbContext CreateContext(
            string? tenantId = Organization.DefaultOrganizationId, bool isPlatformOwner = false)
        {
            var tenant = new TenantContext();
            tenant.SetTenant(tenantId, isPlatformOwner);

            // Conecta o mesmo interceptor da produção: seta as GUCs de RLS por conexão a
            // partir deste tenant. Sem isso, o RLS (FORCE) bloquearia tudo nos testes.
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(ConnectionString)
                .AddInterceptors(new TenantConnectionInterceptor(tenant))
                .Options;

            return new AppDbContext(options, tenant);
        }

        // Limpa todas as tabelas entre testes, preservando o schema/constraints, e
        // re-semeia a organização default (o CASCADE do TRUNCATE também a apagaria).
        public static async Task ResetAsync()
        {
            await using var db = CreateContext();
            await db.Database.ExecuteSqlRawAsync(
                "TRUNCATE organizations, bookings, spaces, resources, users, idempotency_keys, " +
                "refresh_tokens, consents, audit_logs, reviews, invitations RESTART IDENTITY CASCADE;");

            await db.Database.ExecuteSqlRawAsync(
                "INSERT INTO organizations (id, name, slug, status, created_at) " +
                $"VALUES ('{Organization.DefaultOrganizationId}', 'Organização Padrão', 'default', 'active', now());");
        }
    }
}
