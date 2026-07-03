using api.Models;
using api.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using NUnit.Framework;

namespace api.Tests.Services
{
    [TestFixture]
    public class SpacesServiceTests
    {
        // A string de conexão vem da variável de ambiente AGENDIFY_TEST_MONGO — nunca hardcoded.
        // Rode: AGENDIFY_TEST_MONGO="mongodb+srv://USER:PASS@..." dotnet test
        private static readonly string? TestConnectionString =
            Environment.GetEnvironmentVariable("AGENDIFY_TEST_MONGO");
        private static readonly string TestDatabaseName = "test-agendify";

        private IMongoClient _mongoClient = null!;
        private IMongoDatabase _testDatabase = null!;
        private SpacesService _spacesService = null!;
        private IMongoCollection<Space> _spacesCollection = null!;
        private IMongoCollection<Resource> _resourcesCollection = null!;
        private Mock<ILogger<SpacesService>> _mockLogger = null!;

        [OneTimeSetUp]
        public void OneTimeSetUp()
        {
            if (string.IsNullOrWhiteSpace(TestConnectionString))
                Assert.Ignore("Defina a variável de ambiente AGENDIFY_TEST_MONGO para rodar os testes de integração.");

            _mongoClient = new MongoClient(TestConnectionString);
            _testDatabase = _mongoClient.GetDatabase(TestDatabaseName);
        }

        [OneTimeTearDown]
        public void OneTimeTearDown()
        {
            try
            {
                _testDatabase?.DropCollection("spaces");
                _testDatabase?.DropCollection("resources");
            }
            catch
            {
                // Ignorar erros de limpeza
            }
        }

        [SetUp]
        public void Setup()
        {
            _spacesCollection = _testDatabase.GetCollection<Space>("spaces");
            _resourcesCollection = _testDatabase.GetCollection<Resource>("resources");

            _spacesCollection.DeleteMany(Builders<Space>.Filter.Empty);
            _resourcesCollection.DeleteMany(Builders<Resource>.Filter.Empty);

            SeedTestData();

            _mockLogger = new Mock<ILogger<SpacesService>>();

            var databaseSettings = new DatabaseSettings
            {
                ConnectionString = TestConnectionString ?? string.Empty,
                DatabaseName = TestDatabaseName,
                SpacesCollectionName = "spaces",
                ResourcesCollectionName = "resources",
                BookingsCollectionName = "bookings",
                UsersCollectionName = "users"
            };

            var options = Options.Create(databaseSettings);
            _spacesService = new SpacesService(_testDatabase, options, _mockLogger.Object);
        }

        [TearDown]
        public void TearDown()
        {
            try
            {
                _spacesCollection?.DeleteMany(Builders<Space>.Filter.Empty);
                _resourcesCollection?.DeleteMany(Builders<Resource>.Filter.Empty);
            }
            catch
            {
                // Ignorar erros de limpeza
            }
        }

        private void SeedTestData()
        {
            var resources = new List<Resource>
            {
                new Resource
                {
                    Id = "607f1f77bcf86cd799439041",
                    Name = "Projetor",
                    Description = "Projetor Full HD",
                    CreatedAt = DateTime.UtcNow
                },
                new Resource
                {
                    Id = "607f1f77bcf86cd799439042",
                    Name = "Quadro Branco",
                    Description = "Quadro branco grande",
                    CreatedAt = DateTime.UtcNow
                },
                new Resource
                {
                    Id = "607f1f77bcf86cd799439043",
                    Name = "Sistema de Som",
                    Description = "Sistema de som profissional",
                    CreatedAt = DateTime.UtcNow
                }
            };
            _resourcesCollection.InsertMany(resources);

            var spaces = new List<Space>
            {
                new Space
                {
                    Id = "607f1f77bcf86cd799439051",
                    Name = "Sala de Conferência A",
                    Description = "Sala de conferência grande com capacidade para eventos",
                    Capacity = 20,
                    Availability = true,
                    CreatedAt = DateTime.UtcNow,
                    Resources = new List<SpaceResources>
                    {
                        new SpaceResources
                        {
                            ResourceId = "607f1f77bcf86cd799439041",
                            Quantity = 1
                        },
                        new SpaceResources
                        {
                            ResourceId = "607f1f77bcf86cd799439042",
                            Quantity = 2
                        }
                    }
                },
                new Space
                {
                    Id = "607f1f77bcf86cd799439052",
                    Name = "Sala de Reunião B",
                    Description = "Sala de reunião pequena para equipes",
                    Capacity = 8,
                    Availability = true,
                    CreatedAt = DateTime.UtcNow,
                    Resources = new List<SpaceResources>
                    {
                        new SpaceResources
                        {
                            ResourceId = "607f1f77bcf86cd799439042",
                            Quantity = 1
                        }
                    }
                },
                new Space
                {
                    Id = "607f1f77bcf86cd799439053",
                    Name = "Auditório C",
                    Description = "Auditório grande para apresentações",
                    Capacity = 100,
                    Availability = true,
                    CreatedAt = DateTime.UtcNow,
                    Resources = new List<SpaceResources>
                    {
                        new SpaceResources
                        {
                            ResourceId = "607f1f77bcf86cd799439041",
                            Quantity = 2
                        },
                        new SpaceResources
                        {
                            ResourceId = "607f1f77bcf86cd799439043",
                            Quantity = 1
                        }
                    }
                },
                new Space
                {
                    Id = "607f1f77bcf86cd799439054",
                    Name = "Sala Privada D",
                    Description = "Sala privada sem recursos",
                    Capacity = 4,
                    Availability = false,
                    CreatedAt = DateTime.UtcNow,
                    Resources = new List<SpaceResources>()
                }
            };
            _spacesCollection.InsertMany(spaces);
        }

        #region GetById Tests

        [Test]
        public async Task GetById_ShouldReturnSpaceWithResources_WhenSpaceExists()
        {
            var spaceId = "607f1f77bcf86cd799439051";

            var result = await _spacesService.GetById(spaceId);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Id, Is.EqualTo(spaceId));
            Assert.That(result.Name, Is.EqualTo("Sala de Conferência A"));
            Assert.That(result.Resources, Is.Not.Null);
            Assert.That(result.Resources.Count, Is.EqualTo(2));

            var projectorResource = result.Resources.FirstOrDefault(r => r.ResourceId == "607f1f77bcf86cd799439041");
            Assert.That(projectorResource, Is.Not.Null);
            Assert.That(projectorResource!.Resource, Is.Not.Null);
            Assert.That(projectorResource.Resource!.Name, Is.EqualTo("Projetor"));
            Assert.That(projectorResource.Quantity, Is.EqualTo(1));
        }

        [Test]
        public async Task GetById_ShouldReturnSpaceWithoutResources_WhenSpaceHasNoResources()
        {
            var spaceId = "607f1f77bcf86cd799439054";

            var result = await _spacesService.GetById(spaceId);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Id, Is.EqualTo(spaceId));
            Assert.That(result.Name, Is.EqualTo("Sala Privada D"));
            Assert.That(result.Resources, Is.Not.Null);
            Assert.That(result.Resources.Count, Is.EqualTo(0));
        }

        [Test]
        public async Task GetById_ShouldPopulateAllResourceDetails()
        {
            var spaceId = "607f1f77bcf86cd799439053";

            var result = await _spacesService.GetById(spaceId);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Resources.Count, Is.EqualTo(2));
            Assert.That(result.Resources.All(r => r.Resource != null), Is.True);

            var projectorResource = result.Resources.FirstOrDefault(r => r.ResourceId == "607f1f77bcf86cd799439041");
            Assert.That(projectorResource!.Resource!.Description, Is.EqualTo("Projetor Full HD"));

            var soundResource = result.Resources.FirstOrDefault(r => r.ResourceId == "607f1f77bcf86cd799439043");
            Assert.That(soundResource!.Resource!.Name, Is.EqualTo("Sistema de Som"));
        }

        #endregion

        #region GetAsync Tests

        [Test]
        public async Task GetAsync_ShouldReturnAllSpaces_WithResourcesPopulated()
        {
            var result = await _spacesService.GetAsync();

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.EqualTo(4));

            var conferenceRoom = result.FirstOrDefault(s => s.Id == "607f1f77bcf86cd799439051");
            Assert.That(conferenceRoom, Is.Not.Null);
            Assert.That(conferenceRoom!.Resources.Count, Is.EqualTo(2));
            Assert.That(conferenceRoom.Resources.All(r => r.Resource != null), Is.True);
        }

        [Test]
        public async Task GetAsync_ShouldHandleSpacesWithAndWithoutResources()
        {
            var result = await _spacesService.GetAsync();

            var spaceWithResources = result.FirstOrDefault(s => s.Id == "607f1f77bcf86cd799439052");
            var spaceWithoutResources = result.FirstOrDefault(s => s.Id == "607f1f77bcf86cd799439054");

            Assert.That(spaceWithResources, Is.Not.Null);
            Assert.That(spaceWithResources!.Resources.Count, Is.GreaterThan(0));
            Assert.That(spaceWithResources.Resources.All(r => r.Resource != null), Is.True);

            Assert.That(spaceWithoutResources, Is.Not.Null);
            Assert.That(spaceWithoutResources!.Resources.Count, Is.EqualTo(0));
        }

        [Test]
        public async Task GetAsync_ShouldReturnDistinctSpaces()
        {
            var result = await _spacesService.GetAsync();

            var distinctIds = result.Select(s => s.Id).Distinct().Count();
            Assert.That(distinctIds, Is.EqualTo(result.Count));
        }

        [Test]
        public async Task GetAsync_ShouldPopulateSharedResources_AcrossMultipleSpaces()
        {
            var result = await _spacesService.GetAsync();

            var conferenceA = result.FirstOrDefault(s => s.Id == "607f1f77bcf86cd799439051");
            var meetingB = result.FirstOrDefault(s => s.Id == "607f1f77bcf86cd799439052");

            var whiteboardInA = conferenceA!.Resources.FirstOrDefault(r => r.ResourceId == "607f1f77bcf86cd799439042");
            var whiteboardInB = meetingB!.Resources.FirstOrDefault(r => r.ResourceId == "607f1f77bcf86cd799439042");

            Assert.That(whiteboardInA, Is.Not.Null);
            Assert.That(whiteboardInB, Is.Not.Null);
            Assert.That(whiteboardInA!.Resource!.Name, Is.EqualTo("Quadro Branco"));
            Assert.That(whiteboardInB!.Resource!.Name, Is.EqualTo("Quadro Branco"));
        }

        #endregion

        #region Create Tests

        [Test]
        public async Task Create_ShouldAddNewSpace_WithGeneratedId()
        {
            var newSpace = new Space
            {
                Name = "Nova Sala de Treinamento",
                Description = "Sala para treinamentos e workshops",
                Capacity = 15,
                Availability = true,
                CreatedAt = DateTime.UtcNow,
                Resources = new List<SpaceResources>()
            };

            var initialCount = (await _spacesCollection.Find(_ => true).ToListAsync()).Count;

            await _spacesService.Create(newSpace);

            var currentCount = (await _spacesCollection.Find(_ => true).ToListAsync()).Count;
            Assert.That(currentCount, Is.EqualTo(initialCount + 1));
            Assert.That(newSpace.Id, Is.Not.Null);
            Assert.That(newSpace.Id, Is.Not.Empty);

            var addedSpace = await _spacesCollection.Find(s => s.Id == newSpace.Id).FirstOrDefaultAsync();
            Assert.That(addedSpace, Is.Not.Null);
            Assert.That(addedSpace!.Name, Is.EqualTo("Nova Sala de Treinamento"));
            Assert.That(addedSpace.Capacity, Is.EqualTo(15));
        }

        [Test]
        public async Task Create_ShouldPreserveExistingId_WhenIdIsProvided()
        {
            var spaceId = "607f1f77bcf86cd799439099";
            var newSpace = new Space
            {
                Id = spaceId,
                Name = "Sala com ID Customizado",
                Description = "Sala com ID pré-definido",
                Capacity = 10,
                Availability = true,
                CreatedAt = DateTime.UtcNow,
                Resources = new List<SpaceResources>()
            };

            await _spacesService.Create(newSpace);

            Assert.That(newSpace.Id, Is.EqualTo(spaceId));

            var addedSpace = await _spacesCollection.Find(s => s.Id == spaceId).FirstOrDefaultAsync();
            Assert.That(addedSpace, Is.Not.Null);
            Assert.That(addedSpace!.Id, Is.EqualTo(spaceId));
        }

        [Test]
        public async Task Create_ShouldGenerateUniqueIds_ForMultipleSpaces()
        {
            var space1 = new Space
            {
                Name = "Sala 1",
                Description = "Primeira sala",
                Capacity = 5,
                Availability = true
            };

            var space2 = new Space
            {
                Name = "Sala 2",
                Description = "Segunda sala",
                Capacity = 10,
                Availability = true
            };

            await _spacesService.Create(space1);
            await _spacesService.Create(space2);

            Assert.That(space1.Id, Is.Not.Null);
            Assert.That(space2.Id, Is.Not.Null);
            Assert.That(space1.Id, Is.Not.EqualTo(space2.Id));

            var count1 = await _spacesCollection.CountDocumentsAsync(s => s.Id == space1.Id);
            var count2 = await _spacesCollection.CountDocumentsAsync(s => s.Id == space2.Id);
            Assert.That(count1, Is.EqualTo(1));
            Assert.That(count2, Is.EqualTo(1));
        }

        [Test]
        public async Task Create_ShouldLogInformation_WhenCreatingSpace()
        {
            var newSpace = new Space
            {
                Name = "Sala para Log",
                Description = "Sala para testar logging",
                Capacity = 5,
                Availability = true
            };

            await _spacesService.Create(newSpace);

            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Creating space")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Test]
        public async Task Create_ShouldCreateSpaceWithResources()
        {
            var newSpace = new Space
            {
                Name = "Sala com Recursos",
                Description = "Sala equipada",
                Capacity = 12,
                Availability = true,
                Resources = new List<SpaceResources>
                {
                    new SpaceResources
                    {
                        ResourceId = "607f1f77bcf86cd799439041",
                        Quantity = 1
                    }
                }
            };

            await _spacesService.Create(newSpace);

            var addedSpace = await _spacesCollection.Find(s => s.Id == newSpace.Id).FirstOrDefaultAsync();
            Assert.That(addedSpace, Is.Not.Null);
            Assert.That(addedSpace!.Resources, Is.Not.Null);
            Assert.That(addedSpace.Resources.Count, Is.EqualTo(1));
            Assert.That(addedSpace.Resources[0].ResourceId, Is.EqualTo("607f1f77bcf86cd799439041"));
        }

        #endregion

        #region Update Tests

        [Test]
        public async Task Update_ShouldModifyExistingSpace_WhenSpaceExists()
        {
            var spaceId = "607f1f77bcf86cd799439051";
            var updatedSpace = new Space
            {
                Id = spaceId,
                Name = "Sala de Conferência A - Atualizada",
                Description = "Descrição atualizada",
                Capacity = 25,
                Availability = false,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow,
                Resources = new List<SpaceResources>()
            };

            await _spacesService.Update(spaceId, updatedSpace);

            var space = await _spacesCollection.Find(s => s.Id == spaceId).FirstOrDefaultAsync();
            Assert.That(space, Is.Not.Null);
            Assert.That(space!.Name, Is.EqualTo("Sala de Conferência A - Atualizada"));
            Assert.That(space.Capacity, Is.EqualTo(25));
            Assert.That(space.Availability, Is.False);
            Assert.That(space.UpdatedAt, Is.Not.Null);
        }

        [Test]
        public async Task Update_ShouldReplaceSpaceData_WithCorrectParameters()
        {
            var spaceId = "607f1f77bcf86cd799439052";
            var updatedSpace = new Space
            {
                Id = spaceId,
                Name = "Sala B - Nova Configuração",
                Description = "Nova descrição",
                Capacity = 12,
                Availability = true,
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                UpdatedAt = DateTime.UtcNow,
                Resources = new List<SpaceResources>
                {
                    new SpaceResources
                    {
                        ResourceId = "607f1f77bcf86cd799439041",
                        Quantity = 1
                    }
                }
            };

            var initialCount = await _spacesCollection.CountDocumentsAsync(_ => true);

            await _spacesService.Update(spaceId, updatedSpace);

            var currentCount = await _spacesCollection.CountDocumentsAsync(_ => true);
            Assert.That(currentCount, Is.EqualTo(initialCount));

            var space = await _spacesCollection.Find(s => s.Id == spaceId).FirstOrDefaultAsync();
            Assert.That(space, Is.Not.Null);
            Assert.That(space!.Name, Is.EqualTo("Sala B - Nova Configuração"));
            Assert.That(space.Resources.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task Update_ShouldUpdateResources_WhenResourcesAreModified()
        {
            var spaceId = "607f1f77bcf86cd799439053";
            var updatedSpace = new Space
            {
                Id = spaceId,
                Name = "Auditório C",
                Description = "Auditório grande para apresentações",
                Capacity = 100,
                Availability = true,
                CreatedAt = DateTime.UtcNow,
                Resources = new List<SpaceResources>
                {
                    new SpaceResources
                    {
                        ResourceId = "607f1f77bcf86cd799439041",
                        Quantity = 3
                    }
                }
            };

            await _spacesService.Update(spaceId, updatedSpace);

            var space = await _spacesCollection.Find(s => s.Id == spaceId).FirstOrDefaultAsync();
            Assert.That(space, Is.Not.Null);
            Assert.That(space!.Resources.Count, Is.EqualTo(1));
            Assert.That(space.Resources[0].Quantity, Is.EqualTo(3));
        }

        #endregion

        #region Delete Tests

        [Test]
        public async Task Delete_ShouldRemoveSpace_WhenSpaceExists()
        {
            var spaceId = "607f1f77bcf86cd799439051";
            var initialCount = await _spacesCollection.CountDocumentsAsync(_ => true);

            await _spacesService.Delete(spaceId);

            var currentCount = await _spacesCollection.CountDocumentsAsync(_ => true);
            Assert.That(currentCount, Is.EqualTo(initialCount - 1));

            var deletedSpace = await _spacesCollection.Find(s => s.Id == spaceId).FirstOrDefaultAsync();
            Assert.That(deletedSpace, Is.Null);
        }

        [Test]
        public async Task Delete_ShouldOnlyRemoveSpecifiedSpace()
        {
            var spaceId = "607f1f77bcf86cd799439053";
            var otherSpaceId = "607f1f77bcf86cd799439051";

            await _spacesService.Delete(spaceId);

            var deletedSpace = await _spacesCollection.Find(s => s.Id == spaceId).FirstOrDefaultAsync();
            var otherSpace = await _spacesCollection.Find(s => s.Id == otherSpaceId).FirstOrDefaultAsync();

            Assert.That(deletedSpace, Is.Null);
            Assert.That(otherSpace, Is.Not.Null);
        }

        [Test]
        public async Task Delete_ShouldNotAffectResources_WhenSpaceIsDeleted()
        {
            var spaceId = "607f1f77bcf86cd799439051";
            var resourceId = "607f1f77bcf86cd799439041";

            var initialResourceCount = await _resourcesCollection.CountDocumentsAsync(_ => true);

            await _spacesService.Delete(spaceId);

            var currentResourceCount = await _resourcesCollection.CountDocumentsAsync(_ => true);
            Assert.That(currentResourceCount, Is.EqualTo(initialResourceCount));

            var resource = await _resourcesCollection.Find(r => r.Id == resourceId).FirstOrDefaultAsync();
            Assert.That(resource, Is.Not.Null);
        }

        #endregion

        #region Constructor Tests

        // NOTA: a validação de ConnectionString vazia / configuração ausente foi movida
        // para o Program.cs (fail-fast no boot). Os services agora recebem um IMongoDatabase
        // já configurado via DI, então os antigos testes de construtor que checavam
        // ConnectionString/DatabaseSettings nulos não se aplicam mais a esta classe.
        [Test]
        public void Constructor_ShouldInitializeSuccessfully_WithValidSettings()
        {
            var validSettings = new DatabaseSettings
            {
                DatabaseName = TestDatabaseName,
                SpacesCollectionName = "spaces",
                ResourcesCollectionName = "resources",
                BookingsCollectionName = "bookings",
                UsersCollectionName = "users"
            };

            var mockOptions = Options.Create(validSettings);
            var mockLogger = new Mock<ILogger<SpacesService>>();

            Assert.DoesNotThrow(() => new SpacesService(_testDatabase, mockOptions, mockLogger.Object));
        }

        #endregion
    }
}

