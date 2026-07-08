using api.Data;
using api.Models;
using api.Tenancy;
using Microsoft.EntityFrameworkCore;
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

        [OneTimeSetUp]
        public async Task GlobalSetup()
        {
            var external = Environment.GetEnvironmentVariable("AGENDIFY_TEST_POSTGRES");
            if (!string.IsNullOrWhiteSpace(external))
            {
                ConnectionString = external;
            }
            else
            {
                _container = new PostgreSqlBuilder()
                    .WithImage("postgres:16")
                    .Build();
                await _container.StartAsync();
                ConnectionString = _container.GetConnectionString();
            }

            await using var db = CreateContext();
            await db.Database.MigrateAsync();
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
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(ConnectionString)
                .Options;

            var tenant = new TenantContext();
            tenant.SetTenant(tenantId, isPlatformOwner);
            return new AppDbContext(options, tenant);
        }

        // Limpa todas as tabelas entre testes, preservando o schema/constraints, e
        // re-semeia a organização default (o CASCADE do TRUNCATE também a apagaria).
        public static async Task ResetAsync()
        {
            await using var db = CreateContext();
            await db.Database.ExecuteSqlRawAsync(
                "TRUNCATE organizations, bookings, spaces, resources, users, idempotency_keys, " +
                "refresh_tokens, consents, audit_logs, reviews RESTART IDENTITY CASCADE;");

            await db.Database.ExecuteSqlRawAsync(
                "INSERT INTO organizations (id, name, slug, status, created_at) " +
                $"VALUES ('{Organization.DefaultOrganizationId}', 'Organização Padrão', 'default', 'active', now());");
        }
    }
}
