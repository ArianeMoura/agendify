using api.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NUnit.Framework;

namespace api.Tests.Services;

// Prova a MURALHA FINAL (Fase 5): o Postgres, via RLS, recusa linhas de outro tenant
// mesmo quando o filtro do EF é explicitamente ignorado — IgnoreQueryFilters só
// desliga a camada de aplicação; o RLS é imposto pelo banco. Também cobre o WITH CHECK
// (bloqueio de escrita cross-tenant) e o bypass do Platform Owner.
[TestFixture]
public class RowLevelSecurityTests
{
    private const string OrgA = "aaaaaaaa-1111-1111-1111-1111111111aa";
    private const string OrgB = "bbbbbbbb-1111-1111-1111-1111111111bb";

    [SetUp]
    public async Task SetUp()
    {
        await TestDatabaseFixture.ResetAsync();

        await using var db = TestDatabaseFixture.CreateContext();
        db.Organizations.Add(new Organization { Id = OrgA, Name = "A", Slug = "rls-a" });
        db.Organizations.Add(new Organization { Id = OrgB, Name = "B", Slug = "rls-b" });
        await db.SaveChangesAsync();

        await using (var dbA = TestDatabaseFixture.CreateContext(OrgA))
        {
            dbA.Spaces.Add(new Space { Id = Guid.NewGuid().ToString(), Name = "Sala A", Availability = true });
            await dbA.SaveChangesAsync();
        }
        await using (var dbB = TestDatabaseFixture.CreateContext(OrgB))
        {
            dbB.Spaces.Add(new Space { Id = Guid.NewGuid().ToString(), Name = "Sala B", Availability = true });
            await dbB.SaveChangesAsync();
        }
    }

    [Test]
    public async Task Rls_HidesOtherTenant_EvenWhenEfFilterIsIgnored()
    {
        await using var dbA = TestDatabaseFixture.CreateContext(OrgA);

        // IgnoreQueryFilters desliga o filtro do EF; o que ainda esconde B é o RLS.
        var visible = await dbA.Spaces.IgnoreQueryFilters().ToListAsync();

        Assert.That(visible, Has.Count.EqualTo(1));
        Assert.That(visible[0].TenantId, Is.EqualTo(OrgA));
        Assert.That(visible.Any(s => s.TenantId == OrgB), Is.False,
            "RLS deve esconder as linhas de B mesmo com o filtro do EF ignorado.");
    }

    [Test]
    public async Task Rls_BlocksWritingIntoAnotherTenant()
    {
        await using var dbA = TestDatabaseFixture.CreateContext(OrgA);
        // Contexto do tenant A tenta gravar uma linha marcada como de B (TenantId
        // explícito, então o auto-stamp não o sobrescreve).
        dbA.Spaces.Add(new Space
        {
            Id = Guid.NewGuid().ToString(),
            TenantId = OrgB,
            Name = "Intrusa",
            Availability = true,
        });

        // O WITH CHECK do RLS rejeita o INSERT (a app está no tenant A).
        Assert.ThrowsAsync<DbUpdateException>(async () => await dbA.SaveChangesAsync());
    }

    // Deriva a lista do MODELO, não de uma constante: é o que impede uma entidade
    // ITenantScoped nova de entrar sem policy no Postgres. Hoje a cobertura está completa,
    // mas repartida entre migrations — a EnableRowLevelSecurity cobriu 8 tabelas e a
    // AddPasswordResetTokens retrofitou as 2 que faltavam (invitations e a própria
    // password_reset_tokens). Ler só a primeira dá a impressão de que há um buraco; é
    // justamente esse tipo de conclusão (num sentido ou no outro) que este teste tira do
    // campo da leitura de migration e põe no do fato observado no banco.
    [Test]
    public async Task TodaTabelaTenantScoped_TemRlsForcadoEPolicy()
    {
        await using var db = TestDatabaseFixture.CreateContext();

        var tables = db.Model.GetEntityTypes()
            .Where(e => typeof(ITenantScoped).IsAssignableFrom(e.ClrType))
            .Select(e => e.GetTableName()!)
            .Distinct()
            .OrderBy(t => t)
            .ToList();

        Assert.That(tables, Is.Not.Empty, "nenhuma entidade ITenantScoped no modelo?");

        await using var conn = new NpgsqlConnection(TestDatabaseFixture.ConnectionString);
        await conn.OpenAsync();

        foreach (var table in tables)
        {
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                SELECT c.relrowsecurity,
                       c.relforcerowsecurity,
                       (SELECT count(*) FROM pg_policies p
                         WHERE p.schemaname = n.nspname
                           AND p.tablename = c.relname
                           AND p.policyname = 'tenant_isolation')
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE c.relname = @t AND n.nspname = 'public';";
            cmd.Parameters.AddWithValue("t", table);

            await using var reader = await cmd.ExecuteReaderAsync();
            Assert.That(await reader.ReadAsync(), Is.True, $"tabela '{table}' não existe");
            Assert.Multiple(() =>
            {
                Assert.That(reader.GetBoolean(0), Is.True, $"'{table}': RLS não habilitado");
                Assert.That(reader.GetBoolean(1), Is.True,
                    $"'{table}': RLS sem FORCE (o dono da tabela escaparia da policy)");
                Assert.That(reader.GetInt64(2), Is.EqualTo(1),
                    $"'{table}': sem a policy tenant_isolation");
            });
        }
    }

    [Test]
    public async Task PlatformOwner_BypassesRls()
    {
        await using var owner = TestDatabaseFixture.CreateContext(tenantId: null, isPlatformOwner: true);
        var tenants = (await owner.Spaces.ToListAsync())
            .Select(s => s.TenantId).Distinct().ToList();

        Assert.That(tenants, Does.Contain(OrgA));
        Assert.That(tenants, Does.Contain(OrgB));
    }
}
