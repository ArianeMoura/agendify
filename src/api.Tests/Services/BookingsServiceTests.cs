using api.Data;
using api.Models;
using api.Services;
using NUnit.Framework;

namespace api.Tests.Services
{
    // Testes de integração do motor de reservas contra PostgreSQL real (Testcontainers).
    // O foco é a RN-01: prevenção de double-booking garantida pelo banco.
    [TestFixture]
    public class BookingsServiceTests
    {
        private const string UserId = "11111111-1111-1111-1111-111111111111";
        private const string SpaceId = "22222222-2222-2222-2222-222222222222";
        private const string UnavailableSpaceId = "33333333-3333-3333-3333-333333333333";

        private static DateTime Future(int daysAhead, int hour) =>
            DateTime.SpecifyKind(DateTime.UtcNow.Date.AddDays(daysAhead).AddHours(hour), DateTimeKind.Utc);

        [SetUp]
        public async Task SetUp()
        {
            await TestDatabaseFixture.ResetAsync();

            await using var db = TestDatabaseFixture.CreateContext();
            db.Users.Add(new User
            {
                Id = UserId,
                Name = "João Silva",
                Email = "joao@exemplo.com.br",
                Password = "hash",
                Profile = Profile.Common,
            });
            db.Spaces.Add(new Space
            {
                Id = SpaceId,
                Name = "Sala de Conferência A",
                Capacity = 20,
                Availability = true,
            });
            db.Spaces.Add(new Space
            {
                Id = UnavailableSpaceId,
                Name = "Sala em Manutenção",
                Capacity = 10,
                Availability = false,
            });
            await db.SaveChangesAsync();
        }

        private static BookingsService NewService(AppDbContext db) => new(db);

        private static Booking BookingFor(DateTime start, DateTime end, string spaceId = SpaceId) => new()
        {
            UserId = UserId,
            SpaceId = spaceId,
            StartDateTime = start,
            EndDateTime = end,
        };

        // ───────────────────────── Double-booking (o que importa) ─────────────────────────

        [Test]
        public async Task Create_ShouldPersist_WhenNoOverlap()
        {
            await using var db = TestDatabaseFixture.CreateContext();
            var svc = NewService(db);

            await svc.Create(BookingFor(Future(1, 10), Future(1, 11)));

            await using var check = TestDatabaseFixture.CreateContext();
            Assert.That(check.Bookings.Count(), Is.EqualTo(1));
        }

        [Test]
        public async Task Create_ShouldThrowConflict_WhenOverlapping()
        {
            await using (var db = TestDatabaseFixture.CreateContext())
                await NewService(db).Create(BookingFor(Future(1, 10), Future(1, 12)));

            await using var db2 = TestDatabaseFixture.CreateContext();
            Assert.ThrowsAsync<BookingConflictException>(async () =>
                await NewService(db2).Create(BookingFor(Future(1, 11), Future(1, 13))));
        }

        [Test]
        public async Task Create_ShouldAllowAdjacentBookings()
        {
            // [10,11) e [11,12) NÃO se sobrepõem — adjacência permitida (RN-01).
            await using (var db = TestDatabaseFixture.CreateContext())
                await NewService(db).Create(BookingFor(Future(1, 10), Future(1, 11)));

            await using var db2 = TestDatabaseFixture.CreateContext();
            Assert.DoesNotThrowAsync(async () =>
                await NewService(db2).Create(BookingFor(Future(1, 11), Future(1, 12))));

            await using var check = TestDatabaseFixture.CreateContext();
            Assert.That(check.Bookings.Count(), Is.EqualTo(2));
        }

        [Test]
        public async Task Create_ShouldAllowSameSlotOnDifferentSpaces()
        {
            await using var db = TestDatabaseFixture.CreateContext();
            db.Spaces.Add(new Space { Id = "44444444-4444-4444-4444-444444444444", Name = "Outra", Availability = true });
            await db.SaveChangesAsync();

            await using (var d1 = TestDatabaseFixture.CreateContext())
                await NewService(d1).Create(BookingFor(Future(1, 10), Future(1, 11)));
            await using var d2 = TestDatabaseFixture.CreateContext();
            Assert.DoesNotThrowAsync(async () =>
                await NewService(d2).Create(BookingFor(Future(1, 10), Future(1, 11), "44444444-4444-4444-4444-444444444444")));
        }

        [Test]
        public async Task Update_ShouldThrowConflict_WhenMovedOntoOccupiedSlot()
        {
            // Primeira reserva ocupa [10,11).
            await using (var db = TestDatabaseFixture.CreateContext())
                await NewService(db).Create(BookingFor(Future(1, 10), Future(1, 11)));

            // Segunda reserva em [14,15).
            string secondId;
            await using (var db = TestDatabaseFixture.CreateContext())
            {
                var b2 = BookingFor(Future(1, 14), Future(1, 15));
                await NewService(db).Create(b2);
                secondId = b2.Id!;
            }

            // Mover a segunda para cima da primeira → o banco rejeita no UPDATE
            // (fecha a antiga lacuna do PUT que não revalidava sobreposição).
            await using var db2 = TestDatabaseFixture.CreateContext();
            Assert.ThrowsAsync<BookingConflictException>(async () =>
                await NewService(db2).Update(secondId, BookingFor(Future(1, 10), Future(1, 11))));
        }

        [Test]
        public void Create_ShouldThrow_WhenSpaceUnavailable()
        {
            using var db = TestDatabaseFixture.CreateContext();
            var ex = Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await NewService(db).Create(BookingFor(Future(1, 10), Future(1, 11), UnavailableSpaceId)));
            Assert.That(ex!.Message, Does.Contain("não está disponível"));
        }

        [Test]
        public void Create_ShouldThrow_WhenInThePast()
        {
            using var db = TestDatabaseFixture.CreateContext();
            var ex = Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await NewService(db).Create(BookingFor(Future(-1, 10), Future(-1, 11))));
            Assert.That(ex!.Message, Does.Contain("passado"));
        }

        // ───────────────────────── GATE DE CONCORRÊNCIA (Restrição 10) ─────────────────────────

        [Test]
        public async Task Create_Concurrent_SameSlot_ExactlyOnePersists()
        {
            const int n = 100;
            var start = Future(2, 9);
            var end = Future(2, 10);

            // N requisições simultâneas para o MESMO espaço e slot, cada uma com seu
            // próprio DbContext (o DbContext não é thread-safe).
            var tasks = Enumerable.Range(0, n).Select(async _ =>
            {
                await using var db = TestDatabaseFixture.CreateContext();
                try
                {
                    await NewService(db).Create(BookingFor(start, end));
                    return true; // persistiu
                }
                catch (BookingConflictException)
                {
                    return false; // rejeitada pelo banco (409)
                }
            });

            var results = await Task.WhenAll(tasks);

            var persisted = results.Count(ok => ok);
            Assert.That(persisted, Is.EqualTo(1), "Exatamente uma reserva concorrente deveria persistir.");

            await using var check = TestDatabaseFixture.CreateContext();
            Assert.That(check.Bookings.Count(b => b.SpaceId == SpaceId), Is.EqualTo(1),
                "O banco deve conter exatamente uma reserva para o slot disputado.");
        }

        // ───────────────────────── Leitura / join ─────────────────────────

        [Test]
        public async Task GetById_ShouldReturnBookingWithUserAndSpace()
        {
            string id;
            await using (var db = TestDatabaseFixture.CreateContext())
            {
                var b = BookingFor(Future(1, 10), Future(1, 11));
                await NewService(db).Create(b);
                id = b.Id!;
            }

            await using var db2 = TestDatabaseFixture.CreateContext();
            var result = await NewService(db2).GetById(id);

            Assert.That(result, Is.Not.Null);
            Assert.That(result!.User, Is.Not.Null);
            Assert.That(result.User!.Name, Is.EqualTo("João Silva"));
            Assert.That(result.Space, Is.Not.Null);
            Assert.That(result.Space!.Name, Is.EqualTo("Sala de Conferência A"));
        }

        [Test]
        public async Task Delete_ShouldRemoveBooking()
        {
            string id;
            await using (var db = TestDatabaseFixture.CreateContext())
            {
                var b = BookingFor(Future(1, 10), Future(1, 11));
                await NewService(db).Create(b);
                id = b.Id!;
            }

            await using (var db = TestDatabaseFixture.CreateContext())
                await NewService(db).Delete(id);

            await using var check = TestDatabaseFixture.CreateContext();
            Assert.That(check.Bookings.Count(), Is.EqualTo(0));
        }
    }
}
