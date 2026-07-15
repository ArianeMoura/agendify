using System.Net;
using System.Net.Http.Headers;
using System.Text;
using api.Models;
using api.Services;
using NUnit.Framework;

namespace api.Tests.Endpoints
{
    // Pipeline HTTP de /api/reviews, /api/me e /api/analytics. Os de LGPD (/api/me) são os
    // que mais importam aqui: exportação e apagamento operam sobre dados pessoais e derivam
    // o titular da claim — nunca de um id vindo do request.
    [TestFixture]
    public class PrivacyAndReviewsEndpointTests
    {
        private const string AdminId = "55555555-5555-5555-5555-555555555555";
        private const string MemberId = "11111111-1111-1111-1111-111111111111";
        private const string SpaceId = "22222222-2222-2222-2222-222222222222";
        private const string Tenant = Organization.DefaultOrganizationId;

        private ApiFactory _factory = null!;

        [OneTimeSetUp]
        public void OneTimeSetUp()
        {
            ApiFactory.SetEnvironment();
            _factory = new ApiFactory();
        }

        [OneTimeTearDown]
        public void OneTimeTearDown() => _factory.Dispose();

        [SetUp]
        public async Task SetUp()
        {
            await TestDatabaseFixture.ResetAsync();

            await using var db = TestDatabaseFixture.CreateContext();
            db.Users.Add(new User
            {
                Id = MemberId, Name = "João Silva", Email = "joao@exemplo.com.br",
                Password = PasswordHasher.Hash("Senha#Member1"), Role = Role.Member,
            });
            db.Users.Add(new User
            {
                Id = AdminId, Name = "Ana Admin", Email = "ana@exemplo.com.br",
                Password = PasswordHasher.Hash("Senha#Admin1"), Role = Role.OrgAdmin,
            });
            db.Spaces.Add(new Space
            {
                Id = SpaceId, Name = "Sala de Conferência A", Capacity = 20, Availability = true,
            });
            await db.SaveChangesAsync();
        }

        private HttpClient ClientAs(string userId, string role)
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", ApiFactory.Token(userId, role, Tenant));
            return client;
        }

        private static StringContent Json(string body) => new(body, Encoding.UTF8, "application/json");

        // ---- Reviews ----

        [Test]
        public async Task Reviews_Post_Retorna201ECarimbaAutorETenant()
        {
            var response = await ClientAs(MemberId, "Member").PostAsync("/api/reviews",
                Json($@"{{""spaceId"":""{SpaceId}"",""rating"":5,""comment"":""Ótima sala""}}"));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created),
                await response.Content.ReadAsStringAsync());

            await using var db = TestDatabaseFixture.CreateContext();
            var review = db.Reviews.Single();
            Assert.That(review.UserId, Is.EqualTo(MemberId), "O autor vem da claim, não do corpo.");
            Assert.That(review.TenantId, Is.EqualTo(Tenant));
        }

        [Test]
        public async Task Reviews_Post_ComRatingForaDaFaixa_Retorna400()
        {
            var response = await ClientAs(MemberId, "Member").PostAsync("/api/reviews",
                Json($@"{{""spaceId"":""{SpaceId}"",""rating"":9}}"));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        }

        [Test]
        public async Task Reviews_Post_SemToken_Retorna401()
        {
            var response = await _factory.CreateClient().PostAsync("/api/reviews",
                Json($@"{{""spaceId"":""{SpaceId}"",""rating"":5}}"));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
        }

        [Test]
        public async Task Reviews_GetBySpace_Retorna200()
        {
            var client = ClientAs(MemberId, "Member");
            await client.PostAsync("/api/reviews", Json($@"{{""spaceId"":""{SpaceId}"",""rating"":4}}"));

            var response = await client.GetAsync($"/api/reviews/space/{SpaceId}");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(await response.Content.ReadAsStringAsync(), Does.Contain("\"rating\":4"));
        }

        // ---- /api/me (LGPD) ----

        [Test]
        public async Task Me_Consent_Retorna204ERegistraOAceite()
        {
            var response = await ClientAs(MemberId, "Member").PostAsync("/api/me/consent",
                Json(@"{""version"":""1.0""}"));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            await using var db = TestDatabaseFixture.CreateContext();
            Assert.That(db.Consents.Single().UserId, Is.EqualTo(MemberId));
        }

        [Test]
        public async Task Me_DataExport_DevolveOsDadosDoTitularDaClaim()
        {
            var response = await ClientAs(MemberId, "Member").GetAsync("/api/me/data-export");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            var body = await response.Content.ReadAsStringAsync();
            Assert.That(body, Does.Contain("joao@exemplo.com.br"));
            Assert.That(body, Does.Not.Contain("ana@exemplo.com.br"),
                "A exportação não pode conter dados de outra pessoa.");
        }

        [Test]
        public async Task Me_DataExport_SemToken_Retorna401()
        {
            var response = await _factory.CreateClient().GetAsync("/api/me/data-export");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
        }

        // Apagamento por anonimização: remove PII e mantém a reserva agregada.
        [Test]
        public async Task Me_Delete_AnonimizaOProprioUsuario()
        {
            var response = await ClientAs(MemberId, "Member").DeleteAsync("/api/me");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            await using var db = TestDatabaseFixture.CreateContext();
            var user = db.Users.Single(u => u.Id == MemberId);
            Assert.That(user.AnonymizedAt, Is.Not.Null);
            Assert.That(user.Email, Is.Not.EqualTo("joao@exemplo.com.br"), "O e-mail é PII e deve sair.");
        }

        // Conta anonimizada não entra mais.
        [Test]
        public async Task Me_Delete_ImpedeLoginDepois()
        {
            await ClientAs(MemberId, "Member").DeleteAsync("/api/me");

            var login = await _factory.CreateClient().PostAsync("/api/auth/login",
                Json(@"{""email"":""joao@exemplo.com.br"",""password"":""Senha#Member1""}"));

            Assert.That(login.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
        }

        // ---- Analytics ----

        [Test]
        public async Task Analytics_ComoMember_Retorna403()
        {
            var response = await ClientAs(MemberId, "Member")
                .GetAsync("/api/analytics/peak-hours?year=2026&month=7");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        }

        [Test]
        public async Task Analytics_ComoAdmin_Retorna200()
        {
            var response = await ClientAs(AdminId, "OrgAdmin")
                .GetAsync("/api/analytics/peak-hours?year=2026&month=7");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK),
                await response.Content.ReadAsStringAsync());
        }

        [Test]
        public async Task Analytics_ComMesInvalido_Retorna400()
        {
            var response = await ClientAs(AdminId, "OrgAdmin")
                .GetAsync("/api/analytics/peak-hours?year=2026&month=13");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        }
    }
}
