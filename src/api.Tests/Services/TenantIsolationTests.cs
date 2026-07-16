using api.Models;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace api.Tests.Services;

// Prova a garantia central do multi-tenancy (Fase 2): um tenant não enxerga nem
// afeta os dados de outro. Exercita, no nível do AppDbContext, o global query filter
// (leitura), o auto-stamp (escrita) e o bypass do Platform Owner. CreateContext(t)
// simula um request autenticado no tenant t.
[TestFixture]
public class TenantIsolationTests
{
    private const string OrgA = "aaaaaaaa-0000-0000-0000-00000000000a";
    private const string OrgB = "bbbbbbbb-0000-0000-0000-00000000000b";

    [SetUp]
    public async Task SetUp()
    {
        await TestDatabaseFixture.ResetAsync();

        // Dois tenants (Organization não é ITenantScoped: não é filtrada nem carimbada).
        await using var db = TestDatabaseFixture.CreateContext();
        db.Organizations.Add(new Organization { Id = OrgA, Name = "Tenant A", Slug = "tenant-a" });
        db.Organizations.Add(new Organization { Id = OrgB, Name = "Tenant B", Slug = "tenant-b" });
        await db.SaveChangesAsync();

        // Um espaço em cada tenant — o auto-stamp preenche tenant_id a partir do contexto.
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
    public async Task Read_IsScopedToCurrentTenant()
    {
        await using var dbA = TestDatabaseFixture.CreateContext(OrgA);
        var spaces = await dbA.Spaces.ToListAsync();

        Assert.That(spaces, Has.Count.EqualTo(1));
        Assert.That(spaces[0].Name, Is.EqualTo("Sala A"));
        Assert.That(spaces[0].TenantId, Is.EqualTo(OrgA));
    }

    [Test]
    public async Task OtherTenantData_IsInvisible_EvenById()
    {
        string bSpaceId;
        await using (var dbB = TestDatabaseFixture.CreateContext(OrgB))
            bSpaceId = (await dbB.Spaces.SingleAsync()).Id!;

        // Tenant A tenta ler um espaço de B por id conhecido → invisível para ele.
        await using var dbA = TestDatabaseFixture.CreateContext(OrgA);
        var found = await dbA.Spaces.FirstOrDefaultAsync(s => s.Id == bSpaceId);
        Assert.That(found, Is.Null, "A não pode enxergar dados de B nem consultando por id.");
    }

    [Test]
    public async Task Write_IsAutoStampedToCurrentTenant()
    {
        var id = Guid.NewGuid().ToString();
        await using (var dbB = TestDatabaseFixture.CreateContext(OrgB))
        {
            dbB.Spaces.Add(new Space { Id = id, Name = "Nova em B", Availability = true });
            await dbB.SaveChangesAsync();
        }

        // Sem filtro, confirma que a linha nasceu carimbada com o tenant B.
        await using var check = TestDatabaseFixture.CreateContext(OrgB);
        var created = await check.Spaces.IgnoreQueryFilters().SingleAsync(s => s.Id == id);
        Assert.That(created.TenantId, Is.EqualTo(OrgB));
    }

    [Test]
    public async Task PlatformOwner_SeesAllTenants()
    {
        await using var owner = TestDatabaseFixture.CreateContext(tenantId: null, isPlatformOwner: true);
        var tenants = (await owner.Spaces.ToListAsync())
            .Select(s => s.TenantId).Distinct().ToList();

        Assert.That(tenants, Does.Contain(OrgA));
        Assert.That(tenants, Does.Contain(OrgB));
    }
}
