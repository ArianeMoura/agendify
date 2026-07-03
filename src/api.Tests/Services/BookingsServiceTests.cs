using api.Models;
using api.Services;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using NUnit.Framework;

namespace api.Tests.Services
{
    [TestFixture]
    public class BookingsServiceTests
    {
        // A string de conexão vem da variável de ambiente AGENDIFY_TEST_MONGO — nunca hardcoded.
        // Rode: AGENDIFY_TEST_MONGO="mongodb+srv://USER:PASS@..." dotnet test
        private static readonly string? TestConnectionString =
            Environment.GetEnvironmentVariable("AGENDIFY_TEST_MONGO");
        private static readonly string TestDatabaseName = "test-agendify";

        private IMongoClient _mongoClient = null!;
        private IMongoDatabase _testDatabase = null!;
        private BookingsService _bookingsService = null!;
        private IMongoCollection<Booking> _bookingsCollection = null!;
        private IMongoCollection<User> _usersCollection = null!;
        private IMongoCollection<Space> _spacesCollection = null!;

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
                _testDatabase?.DropCollection("bookings");
                _testDatabase?.DropCollection("users");
                _testDatabase?.DropCollection("spaces");
            }
            catch
            {
                // Ignorar erros de limpeza
            }
        }

        [SetUp]
        public void Setup()
        {
            _bookingsCollection = _testDatabase.GetCollection<Booking>("bookings");
            _usersCollection = _testDatabase.GetCollection<User>("users");
            _spacesCollection = _testDatabase.GetCollection<Space>("spaces");

            _bookingsCollection.DeleteMany(Builders<Booking>.Filter.Empty);
            _usersCollection.DeleteMany(Builders<User>.Filter.Empty);
            _spacesCollection.DeleteMany(Builders<Space>.Filter.Empty);

            SeedTestData();

            var databaseSettings = new DatabaseSettings
            {
                ConnectionString = TestConnectionString ?? string.Empty,
                DatabaseName = TestDatabaseName,
                BookingsCollectionName = "bookings",
                UsersCollectionName = "users",
                SpacesCollectionName = "spaces"
            };

            var options = Options.Create(databaseSettings);
            _bookingsService = new BookingsService(_testDatabase, options);
        }

        [TearDown]
        public void TearDown()
        {
            try
            {
                _bookingsCollection?.DeleteMany(Builders<Booking>.Filter.Empty);
                _usersCollection?.DeleteMany(Builders<User>.Filter.Empty);
                _spacesCollection?.DeleteMany(Builders<Space>.Filter.Empty);
            }
            catch
            {
                // Ignorar erros de limpeza
            }
        }

        private void SeedTestData()
        {
            var users = new List<User>
            {
                new User
                {
                    Id = "507f1f77bcf86cd799439011",
                    Name = "João Silva",
                    Email = "joao.silva@exemplo.com.br",
                    Password = "hashedpassword123",
                    Profile = Profile.Common,
                    CreatedAt = DateTime.UtcNow
                },
                new User
                {
                    Id = "507f1f77bcf86cd799439012",
                    Name = "Maria Santos",
                    Email = "maria.santos@exemplo.com.br",
                    Password = "hashedpassword456",
                    Profile = Profile.Administrator,
                    CreatedAt = DateTime.UtcNow
                }
            };
            _usersCollection.InsertMany(users);

            var spaces = new List<Space>
            {
                new Space
                {
                    Id = "507f1f77bcf86cd799439021",
                    Name = "Sala de Conferência A",
                    Description = "Sala de conferência grande com capacidade para eventos",
                    Capacity = 20,
                    Availability = true,
                    CreatedAt = DateTime.UtcNow
                },
                new Space
                {
                    Id = "507f1f77bcf86cd799439022",
                    Name = "Sala de Reunião B",
                    Description = "Sala de reunião pequena para equipes",
                    Capacity = 8,
                    Availability = true,
                    CreatedAt = DateTime.UtcNow
                }
            };
            _spacesCollection.InsertMany(spaces);

            var bookings = new List<Booking>
            {
                new Booking
                {
                    Id = "507f1f77bcf86cd799439031",
                    UserId = "507f1f77bcf86cd799439011",
                    SpaceId = "507f1f77bcf86cd799439021",
                    StartDateTime = DateTime.UtcNow.AddDays(1),
                    EndDateTime = DateTime.UtcNow.AddDays(1).AddHours(2),
                    CreatedAt = DateTime.UtcNow
                },
                new Booking
                {
                    Id = "507f1f77bcf86cd799439032",
                    UserId = "507f1f77bcf86cd799439011",
                    SpaceId = "507f1f77bcf86cd799439022",
                    StartDateTime = DateTime.UtcNow.AddDays(2),
                    EndDateTime = DateTime.UtcNow.AddDays(2).AddHours(1),
                    CreatedAt = DateTime.UtcNow
                },
                new Booking
                {
                    Id = "507f1f77bcf86cd799439033",
                    UserId = "507f1f77bcf86cd799439012",
                    SpaceId = "507f1f77bcf86cd799439021",
                    StartDateTime = DateTime.UtcNow.AddDays(3),
                    EndDateTime = DateTime.UtcNow.AddDays(3).AddHours(3),
                    CreatedAt = DateTime.UtcNow
                }
            };
            _bookingsCollection.InsertMany(bookings);
        }

         #region Unit Tests for IsSpaceAvailable

        [Test]
        public async Task IsSpaceAvailable_ShouldReturnTrue_WhenSpaceIsAvailableAndNoConflicts()
        {

            var newBooking = new Booking
            {
                UserId = "507f1f77bcf86cd799439011",
                SpaceId = "507f1f77bcf86cd799439021",
                StartDateTime = DateTime.UtcNow.AddDays(10),
                EndDateTime = DateTime.UtcNow.AddDays(10).AddHours(2)
            };


            var result = await _bookingsService.IsSpaceAvailable(newBooking);


            Assert.That(result, Is.True, "O espaço deveria estar disponível para este horário");
        }

        [Test]
        public async Task IsSpaceAvailable_ShouldReturnFalse_WhenSpaceHasConflictingBooking()
        {

            var conflictingBooking = new Booking
            {
                UserId = "507f1f77bcf86cd799439012",
                SpaceId = "507f1f77bcf86cd799439021",
                StartDateTime = DateTime.UtcNow.AddDays(1).AddHours(1),
                EndDateTime = DateTime.UtcNow.AddDays(1).AddHours(3)
            };


            var result = await _bookingsService.IsSpaceAvailable(conflictingBooking);


            Assert.That(result, Is.False, "O espaço não deveria estar disponível devido a conflito de horário");
        }

        [Test]
        public async Task IsSpaceAvailable_ShouldReturnFalse_WhenNewBookingEngulfsExistingBooking()
        {

            var engulfingBooking = new Booking
            {
                UserId = "507f1f77bcf86cd799439012",
                SpaceId = "507f1f77bcf86cd799439021",
                StartDateTime = DateTime.UtcNow.AddDays(1).AddHours(-1),
                EndDateTime = DateTime.UtcNow.AddDays(1).AddHours(3)
            };


            var result = await _bookingsService.IsSpaceAvailable(engulfingBooking);


            Assert.That(result, Is.False, "O espaço não deveria estar disponível quando a nova reserva engloba uma existente");
        }

        [Test]
        public async Task IsSpaceAvailable_ShouldReturnFalse_WhenExistingBookingEngulfsNewBooking()
        {
            var engulfedBooking = new Booking
            {
                UserId = "507f1f77bcf86cd799439012",
                SpaceId = "507f1f77bcf86cd799439021",
                StartDateTime = DateTime.UtcNow.AddDays(1).AddMinutes(30),
                EndDateTime = DateTime.UtcNow.AddDays(1).AddMinutes(90)
            };


            var result = await _bookingsService.IsSpaceAvailable(engulfedBooking);


            Assert.That(result, Is.False, "O espaço não deveria estar disponível quando está dentro de uma reserva existente");
        }

        [Test]
        public async Task IsSpaceAvailable_ShouldReturnTrue_WhenBookingEndsExactlyWhenAnotherStarts()
        {
            var baseTime = new DateTime(2025, 12, 1, 10, 0, 0, DateTimeKind.Utc);

            _bookingsCollection.DeleteMany(Builders<Booking>.Filter.Empty);
            var existingBooking = new Booking
            {
                Id = "507f1f77bcf86cd799439034",
                UserId = "507f1f77bcf86cd799439011",
                SpaceId = "507f1f77bcf86cd799439021",
                StartDateTime = baseTime,
                EndDateTime = baseTime.AddHours(2),
                CreatedAt = DateTime.UtcNow
            };
            _bookingsCollection.InsertOne(existingBooking);

            var adjacentBooking = new Booking
            {
                UserId = "507f1f77bcf86cd799439012",
                SpaceId = "507f1f77bcf86cd799439021",
                StartDateTime = baseTime.AddHours(-2),
                EndDateTime = baseTime
            };


            var result = await _bookingsService.IsSpaceAvailable(adjacentBooking);


            Assert.That(result, Is.True, "O espaço deveria estar disponível quando não há sobreposição real");
        }

        [Test]
        public void IsSpaceAvailable_ShouldThrowException_WhenSpaceDoesNotExist()
        {
            var bookingWithInvalidSpace = new Booking
            {
                UserId = "507f1f77bcf86cd799439011",
                SpaceId = "507f1f77bcf86cd799999999",
                StartDateTime = DateTime.UtcNow.AddDays(10),
                EndDateTime = DateTime.UtcNow.AddDays(10).AddHours(2)
            };

            var ex = Assert.ThrowsAsync<InvalidOperationException>(
                async () => await _bookingsService.IsSpaceAvailable(bookingWithInvalidSpace)
            );
            Assert.That(ex!.Message, Does.Contain("não foi encontrado"));
        }

        [Test]
        public void IsSpaceAvailable_ShouldThrowException_WhenSpaceIsNotAvailable()
        {
            var unavailableSpace = new Space
            {
                Id = "507f1f77bcf86cd799439023",
                Name = "Sala em Manutenção",
                Description = "Sala temporariamente indisponível",
                Capacity = 10,
                Availability = false,
                CreatedAt = DateTime.UtcNow
            };
            _spacesCollection.InsertOne(unavailableSpace);

            var bookingForUnavailableSpace = new Booking
            {
                UserId = "507f1f77bcf86cd799439011",
                SpaceId = "507f1f77bcf86cd799439023",
                StartDateTime = DateTime.UtcNow.AddDays(10),
                EndDateTime = DateTime.UtcNow.AddDays(10).AddHours(2)
            };

            var ex = Assert.ThrowsAsync<InvalidOperationException>(
                async () => await _bookingsService.IsSpaceAvailable(bookingForUnavailableSpace)
            );

            Assert.That(ex!.Message, Does.Contain("não está disponível para reservas"));
        }

        [Test]
        public void IsSpaceAvailable_ShouldThrowException_WhenStartDateIsAfterEndDate()
        {
            var invalidBooking = new Booking
            {
                UserId = "507f1f77bcf86cd799439011",
                SpaceId = "507f1f77bcf86cd799439021",
                StartDateTime = DateTime.UtcNow.AddDays(10).AddHours(5),
                EndDateTime = DateTime.UtcNow.AddDays(10).AddHours(2)
            };

            var ex = Assert.ThrowsAsync<InvalidOperationException>(
                async () => await _bookingsService.IsSpaceAvailable(invalidBooking)
            );
            Assert.That(ex!.Message, Does.Contain("data de início deve ser anterior"));
        }

        [Test]
        public void IsSpaceAvailable_ShouldThrowException_WhenStartDateEqualsEndDate()
        {
            var sameDateBooking = new Booking
            {
                UserId = "507f1f77bcf86cd799439011",
                SpaceId = "507f1f77bcf86cd799439021",
                StartDateTime = DateTime.UtcNow.AddDays(10),
                EndDateTime = DateTime.UtcNow.AddDays(10)
            };

            var ex = Assert.ThrowsAsync<InvalidOperationException>(
                async () => await _bookingsService.IsSpaceAvailable(sameDateBooking)
            );
            Assert.That(ex!.Message, Does.Contain("data de início deve ser anterior"));
        }

        [Test]
        public async Task IsSpaceAvailable_ShouldReturnTrue_WhenMultipleSpacesAndNoConflictForTargetSpace()
        {
            var bookingForDifferentSpace = new Booking
            {
                UserId = "507f1f77bcf86cd799439011",
                SpaceId = "507f1f77bcf86cd799439022",
                StartDateTime = DateTime.UtcNow.AddDays(1),
                EndDateTime = DateTime.UtcNow.AddDays(1).AddHours(2)
            };

            var result = await _bookingsService.IsSpaceAvailable(bookingForDifferentSpace);

            Assert.That(result, Is.True, "Espaços diferentes não devem conflitar entre si");
        }

        #endregion

        #region GetById Tests

        [Test]
        public async Task GetById_ShouldReturnBookingWithUserAndSpace_WhenBookingExists()
        {
            var bookingId = "507f1f77bcf86cd799439031";

            var result = await _bookingsService.GetById(bookingId);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Id, Is.EqualTo(bookingId));
            Assert.That(result.User, Is.Not.Null);
            Assert.That(result.User.Name, Is.EqualTo("João Silva"));
            Assert.That(result.Space, Is.Not.Null);
            Assert.That(result.Space.Name, Is.EqualTo("Sala de Conferência A"));
            Assert.That(result.UserId, Is.EqualTo("507f1f77bcf86cd799439011"));
            Assert.That(result.SpaceId, Is.EqualTo("507f1f77bcf86cd799439021"));
        }

        [Test]
        public async Task GetById_ShouldReturnCorrectUserAndSpaceRelations()
        {
            var bookingId = "507f1f77bcf86cd799439033";

            var result = await _bookingsService.GetById(bookingId);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.User.Name, Is.EqualTo("Maria Santos"));
            Assert.That(result.User.Profile, Is.EqualTo(Profile.Administrator));
            Assert.That(result.Space.Name, Is.EqualTo("Sala de Conferência A"));
        }

        #endregion

        #region GetByUserId Tests

        [Test]
        public async Task GetByUserId_ShouldReturnAllBookingsForUser_WhenUserHasBookings()
        {
            var userId = "507f1f77bcf86cd799439011";

            var result = await _bookingsService.GetByUserId(userId);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.EqualTo(2));
            Assert.That(result.All(b => b.UserId == userId), Is.True);
            Assert.That(result.All(b => b.User != null), Is.True);
            Assert.That(result.All(b => b.Space != null), Is.True);
            Assert.That(result[0].User.Name, Is.EqualTo("João Silva"));

            var bookingIds = result.Select(b => b.Id).ToList();
            Assert.That(bookingIds, Does.Contain("507f1f77bcf86cd799439031"));
            Assert.That(bookingIds, Does.Contain("507f1f77bcf86cd799439032"));
        }

        [Test]
        public async Task GetByUserId_ShouldReturnEmptyList_WhenUserHasNoBookings()
        {
            var userId = "507f1f77bcf86cd799439099";

            var result = await _bookingsService.GetByUserId(userId);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.EqualTo(0));
        }

        #endregion

        #region GetAsync Tests

        [Test]
        public async Task GetAsync_ShouldReturnAllBookings_WithUserAndSpaceData()
        {
            var result = await _bookingsService.GetAsync();

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count, Is.EqualTo(3));
            Assert.That(result.All(b => b.User != null), Is.True);
            Assert.That(result.All(b => b.Space != null), Is.True);
            Assert.That(result.Select(b => b.Id).Distinct().Count(), Is.EqualTo(3));

            var firstBooking = result.FirstOrDefault(b => b.Id == "507f1f77bcf86cd799439031");
            Assert.That(firstBooking, Is.Not.Null);
            Assert.That(firstBooking!.User.Name, Is.EqualTo("João Silva"));
            Assert.That(firstBooking.Space.Name, Is.EqualTo("Sala de Conferência A"));
        }

        #endregion

        #region Create Tests

        [Test]
        public async Task Create_ShouldAddNewBooking_WithGeneratedId()
        {
            var newBooking = new Booking
            {
                UserId = "507f1f77bcf86cd799439011",
                SpaceId = "507f1f77bcf86cd799439021",
                StartDateTime = DateTime.UtcNow.AddDays(5),
                EndDateTime = DateTime.UtcNow.AddDays(5).AddHours(2),
                CreatedAt = DateTime.UtcNow
            };

            var initialCount = (await _bookingsCollection.Find(_ => true).ToListAsync()).Count;

            await _bookingsService.Create(newBooking);

            var currentCount = (await _bookingsCollection.Find(_ => true).ToListAsync()).Count;
            Assert.That(currentCount, Is.EqualTo(initialCount + 1));
            Assert.That(newBooking.Id, Is.Not.Null);
            Assert.That(newBooking.Id, Is.Not.Empty);

            var addedBooking = await _bookingsCollection.Find(b => b.Id == newBooking.Id).FirstOrDefaultAsync();
            Assert.That(addedBooking, Is.Not.Null);
            Assert.That(addedBooking!.UserId, Is.EqualTo("507f1f77bcf86cd799439011"));
            Assert.That(addedBooking.SpaceId, Is.EqualTo("507f1f77bcf86cd799439021"));
        }

        [Test]
        public async Task Create_ShouldPreserveExistingId_WhenIdIsProvided()
        {
            var bookingId = "507f1f77bcf86cd799439099";
            var newBooking = new Booking
            {
                Id = bookingId,
                UserId = "507f1f77bcf86cd799439011",
                SpaceId = "507f1f77bcf86cd799439021",
                StartDateTime = DateTime.UtcNow.AddDays(5),
                EndDateTime = DateTime.UtcNow.AddDays(5).AddHours(2),
                CreatedAt = DateTime.UtcNow
            };

            await _bookingsService.Create(newBooking);

            Assert.That(newBooking.Id, Is.EqualTo(bookingId));

            var addedBooking = await _bookingsCollection.Find(b => b.Id == bookingId).FirstOrDefaultAsync();
            Assert.That(addedBooking, Is.Not.Null);
            Assert.That(addedBooking!.Id, Is.EqualTo(bookingId));
        }

        [Test]
        public async Task Create_ShouldGenerateUniqueIds_ForMultipleBookings()
        {
            var booking1 = new Booking
            {
                UserId = "507f1f77bcf86cd799439011",
                SpaceId = "507f1f77bcf86cd799439021",
                StartDateTime = DateTime.UtcNow.AddDays(6),
                EndDateTime = DateTime.UtcNow.AddDays(6).AddHours(2)
            };

            var booking2 = new Booking
            {
                UserId = "507f1f77bcf86cd799439012",
                SpaceId = "507f1f77bcf86cd799439022",
                StartDateTime = DateTime.UtcNow.AddDays(7),
                EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2)
            };

            await _bookingsService.Create(booking1);
            await _bookingsService.Create(booking2);

            Assert.That(booking1.Id, Is.Not.Null);
            Assert.That(booking2.Id, Is.Not.Null);
            Assert.That(booking1.Id, Is.Not.EqualTo(booking2.Id));

            var count1 = await _bookingsCollection.CountDocumentsAsync(b => b.Id == booking1.Id);
            var count2 = await _bookingsCollection.CountDocumentsAsync(b => b.Id == booking2.Id);
            Assert.That(count1, Is.EqualTo(1));
            Assert.That(count2, Is.EqualTo(1));
        }

        #endregion

        #region Update Tests

        [Test]
        public async Task Update_ShouldModifyExistingBooking_WhenBookingExists()
        {
            var bookingId = "507f1f77bcf86cd799439031";
            var updatedStartDate = DateTime.UtcNow.AddDays(10);
            var updatedBooking = new Booking
            {
                Id = bookingId,
                UserId = "507f1f77bcf86cd799439011",
                SpaceId = "507f1f77bcf86cd799439021",
                StartDateTime = updatedStartDate,
                EndDateTime = updatedStartDate.AddHours(3),
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow
            };

            await _bookingsService.Update(bookingId, updatedBooking);

            var booking = await _bookingsCollection.Find(b => b.Id == bookingId).FirstOrDefaultAsync();
            Assert.That(booking, Is.Not.Null);
            Assert.That(booking!.StartDateTime.Date, Is.EqualTo(updatedStartDate.Date));
            Assert.That(booking.UpdatedAt, Is.Not.Null);
            Assert.That(booking.Id, Is.EqualTo(bookingId));
        }

        [Test]
        public async Task Update_ShouldReplaceBookingData_WithCorrectParameters()
        {
            var bookingId = "507f1f77bcf86cd799439032";
            var updatedBooking = new Booking
            {
                Id = bookingId,
                UserId = "507f1f77bcf86cd799439011",
                SpaceId = "507f1f77bcf86cd799439022",
                StartDateTime = DateTime.UtcNow.AddDays(15),
                EndDateTime = DateTime.UtcNow.AddDays(15).AddHours(4),
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                UpdatedAt = DateTime.UtcNow
            };

            var initialCount = await _bookingsCollection.CountDocumentsAsync(_ => true);

            await _bookingsService.Update(bookingId, updatedBooking);

            var currentCount = await _bookingsCollection.CountDocumentsAsync(_ => true);
            Assert.That(currentCount, Is.EqualTo(initialCount));

            var booking = await _bookingsCollection.Find(b => b.Id == bookingId).FirstOrDefaultAsync();
            Assert.That(booking, Is.Not.Null);
            Assert.That(booking!.StartDateTime.Date, Is.EqualTo(updatedBooking.StartDateTime.Date));
        }

        #endregion

        #region Delete Tests

        [Test]
        public async Task Delete_ShouldRemoveBooking_WhenBookingExists()
        {
            var bookingId = "507f1f77bcf86cd799439031";
            var initialCount = await _bookingsCollection.CountDocumentsAsync(_ => true);

            await _bookingsService.Delete(bookingId);

            var currentCount = await _bookingsCollection.CountDocumentsAsync(_ => true);
            Assert.That(currentCount, Is.EqualTo(initialCount - 1));

            var deletedBooking = await _bookingsCollection.Find(b => b.Id == bookingId).FirstOrDefaultAsync();
            Assert.That(deletedBooking, Is.Null);
        }

        [Test]
        public async Task Delete_ShouldOnlyRemoveSpecifiedBooking()
        {
            var bookingId = "507f1f77bcf86cd799439033";
            var otherBookingId = "507f1f77bcf86cd799439031";

            await _bookingsService.Delete(bookingId);

            var deletedBooking = await _bookingsCollection.Find(b => b.Id == bookingId).FirstOrDefaultAsync();
            var otherBooking = await _bookingsCollection.Find(b => b.Id == otherBookingId).FirstOrDefaultAsync();

            Assert.That(deletedBooking, Is.Null);
            Assert.That(otherBooking, Is.Not.Null);
        }

        #endregion

        #region Constructor Tests

        // NOTA: a validação de ConnectionString vazia / configuração ausente foi movida
        // para o Program.cs (fail-fast no boot). O service agora recebe um IMongoDatabase
        // já configurado via DI, então os antigos testes de construtor que checavam
        // ConnectionString/DatabaseSettings nulos não se aplicam mais a esta classe.
        [Test]
        public void Constructor_ShouldInitializeSuccessfully_WithValidSettings()
        {
            var validSettings = new DatabaseSettings
            {
                DatabaseName = TestDatabaseName,
                BookingsCollectionName = "bookings",
                UsersCollectionName = "users",
                SpacesCollectionName = "spaces"
            };

            var mockOptions = Options.Create(validSettings);

            Assert.DoesNotThrow(() => new BookingsService(_testDatabase, mockOptions));
        }

        #endregion
    }
}
