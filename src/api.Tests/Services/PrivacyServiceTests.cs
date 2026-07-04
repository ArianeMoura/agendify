using api.Models;
using api.Services;
using NUnit.Framework;

namespace api.Tests.Services
{
    [TestFixture]
    public class PrivacyServiceTests
    {
        private const string UserId = "55555555-5555-5555-5555-555555555555";
        private const string SpaceId = "66666666-6666-6666-6666-666666666666";

        [SetUp]
        public async Task SetUp()
        {
            await TestDatabaseFixture.ResetAsync();
            await using var db = TestDatabaseFixture.CreateContext();
            db.Users.Add(new User { Id = UserId, Name = "João", Email = "joao@x.dev", Password = "hash", Profile = Profile.Common });
            db.Spaces.Add(new Space { Id = SpaceId, Name = "Sala", Availability = true });
            db.Bookings.Add(new Booking
            {
                Id = Guid.NewGuid().ToString(),
                UserId = UserId,
                SpaceId = SpaceId,
                StartDateTime = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(1), DateTimeKind.Utc),
                EndDateTime = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(1).AddHours(1), DateTimeKind.Utc),
            });
            db.Reviews.Add(new Review { Id = Guid.NewGuid().ToString(), UserId = UserId, SpaceId = SpaceId, Rating = 5, Comment = "Ótima sala" });
            await db.SaveChangesAsync();
        }

        [Test]
        public async Task Consent_ShouldBeRecorded()
        {
            await using (var db = TestDatabaseFixture.CreateContext())
                await new PrivacyService(db).RecordConsentAsync(UserId, PrivacyService.CurrentConsentVersion);

            await using var check = TestDatabaseFixture.CreateContext();
            Assert.That(check.Consents.Count(c => c.UserId == UserId), Is.EqualTo(1));
        }

        [Test]
        public async Task Export_ShouldReturnData_AndWriteAuditLog()
        {
            object? data;
            await using (var db = TestDatabaseFixture.CreateContext())
                data = await new PrivacyService(db).ExportAsync(UserId);

            Assert.That(data, Is.Not.Null);

            await using var check = TestDatabaseFixture.CreateContext();
            Assert.That(check.AuditLogs.Count(a => a.UserId == UserId && a.Action == "data_exported"), Is.EqualTo(1));
        }

        [Test]
        public async Task Anonymize_ShouldTombstoneUser_ButPreserveBooking()
        {
            await using (var db = TestDatabaseFixture.CreateContext())
            {
                var ok = await new PrivacyService(db).AnonymizeAsync(UserId);
                Assert.That(ok, Is.True);
            }

            await using var check = TestDatabaseFixture.CreateContext();
            var user = check.Users.Single(u => u.Id == UserId);
            Assert.That(user.AnonymizedAt, Is.Not.Null, "usuário deve ficar marcado como anonimizado");
            Assert.That(user.Name, Does.Contain("removido"));
            Assert.That(user.Email, Does.Not.Contain("joao@x.dev"));

            // A reserva agregada permanece (vínculo preservado no tombstone).
            Assert.That(check.Bookings.Count(b => b.UserId == UserId), Is.EqualTo(1),
                "a reserva deve ser preservada para relatórios de ocupação");

            // Comentário (texto livre com possível PII) foi removido; rating preservado.
            var review = check.Reviews.Single(r => r.UserId == UserId);
            Assert.That(review.Comment, Is.Null);
            Assert.That(review.Rating, Is.EqualTo(5));

            // Auditoria registrada.
            Assert.That(check.AuditLogs.Count(a => a.Action == "account_anonymized"), Is.EqualTo(1));
        }

        [Test]
        public async Task Anonymize_ShouldBeIdempotent()
        {
            await using (var db = TestDatabaseFixture.CreateContext())
                await new PrivacyService(db).AnonymizeAsync(UserId);
            await using (var db = TestDatabaseFixture.CreateContext())
            {
                var second = await new PrivacyService(db).AnonymizeAsync(UserId);
                Assert.That(second, Is.True);
            }
        }
    }
}
