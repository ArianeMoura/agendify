using api.Data;
using api.Models;
using api.Services;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;

namespace api.Tests.Services;

// Valida o mapeamento novo do Space no Postgres: recursos embutidos como jsonb
// (owned collection) + enriquecimento do objeto Resource a partir da tabela.
[TestFixture]
public class SpacesServiceTests
{
    private const string ProjectorId = "aaaa1111-0000-0000-0000-000000000001";
    private const string WhiteboardId = "aaaa1111-0000-0000-0000-000000000002";
    private const string SpaceId = "bbbb2222-0000-0000-0000-000000000001";

    private static SpacesService NewService(AppDbContext db) =>
        new(db, NullLogger<SpacesService>.Instance);

    [SetUp]
    public async Task SetUp()
    {
        await TestDatabaseFixture.ResetAsync();

        await using var db = TestDatabaseFixture.CreateContext();
        db.Resources.Add(new Resource { Id = ProjectorId, Name = "Projetor", Description = "Full HD" });
        db.Resources.Add(new Resource { Id = WhiteboardId, Name = "Quadro Branco" });
        db.Spaces.Add(new Space
        {
            Id = SpaceId,
            Name = "Sala de Conferência A",
            Capacity = 20,
            Availability = true,
            AvailableHours = new List<string> { "08:00", "09:00", "10:00" },
            Resources = new List<SpaceResources>
            {
                new() { ResourceId = ProjectorId, Quantity = 1 },
                new() { ResourceId = WhiteboardId, Quantity = 2 },
            },
        });
        await db.SaveChangesAsync();
    }

    [Test]
    public async Task GetById_ShouldRoundTripJsonbResourcesAndAvailableHours()
    {
        await using var db = TestDatabaseFixture.CreateContext();
        var space = await NewService(db).GetById(SpaceId);

        Assert.That(space, Is.Not.Null);
        Assert.That(space!.AvailableHours, Is.EquivalentTo(new[] { "08:00", "09:00", "10:00" }));
        Assert.That(space.Resources.Count, Is.EqualTo(2));
    }

    [Test]
    public async Task GetById_ShouldEnrichResourceObjectsFromResourcesTable()
    {
        await using var db = TestDatabaseFixture.CreateContext();
        var space = await NewService(db).GetById(SpaceId);

        var projector = space!.Resources.First(r => r.ResourceId == ProjectorId);
        Assert.That(projector.Resource, Is.Not.Null);
        Assert.That(projector.Resource!.Name, Is.EqualTo("Projetor"));
        Assert.That(projector.Quantity, Is.EqualTo(1));
    }

    [Test]
    public async Task Create_ShouldPersistSpaceWithEmbeddedResources()
    {
        await using (var db = TestDatabaseFixture.CreateContext())
        {
            await NewService(db).Create(new Space
            {
                Name = "Nova Sala",
                Capacity = 12,
                Availability = true,
                Resources = new List<SpaceResources> { new() { ResourceId = ProjectorId, Quantity = 3 } },
            });
        }

        await using var check = TestDatabaseFixture.CreateContext();
        var created = check.Spaces.First(s => s.Name == "Nova Sala");
        Assert.That(created.Id, Is.Not.Null.And.Not.Empty);
        Assert.That(created.Resources.Single().Quantity, Is.EqualTo(3));
    }

    [Test]
    public async Task Delete_ShouldRemoveSpaceButKeepResources()
    {
        await using (var db = TestDatabaseFixture.CreateContext())
            await NewService(db).Delete(SpaceId);

        await using var check = TestDatabaseFixture.CreateContext();
        Assert.That(check.Spaces.Count(), Is.EqualTo(0));
        Assert.That(check.Resources.Count(), Is.EqualTo(2), "Recursos não devem ser apagados ao remover o espaço.");
    }
}
