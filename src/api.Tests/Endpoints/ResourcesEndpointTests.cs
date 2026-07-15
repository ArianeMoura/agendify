using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using api.Models;
using NUnit.Framework;

namespace api.Tests.Endpoints
{
    // Testes do pipeline HTTP de /api/resources. Nenhum cliente consome estes endpoints hoje,
    // então esta é a única cobertura que eles têm — e a única forma de flagrar o 400 do
    // TenantId, que os testes de service não alcançam.
    [TestFixture]
    public class ResourcesEndpointTests
    {
        private const string AdminId = "55555555-5555-5555-5555-555555555555";
        private const string MemberId = "11111111-1111-1111-1111-111111111111";
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
        public async Task SetUp() => await TestDatabaseFixture.ResetAsync();

        private HttpClient ClientAs(string userId, string role)
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", ApiFactory.Token(userId, role, Tenant));
            return client;
        }

        private static StringContent Json(string body) =>
            new(body, Encoding.UTF8, "application/json");

        [Test]
        public async Task Post_SemTenantId_Retorna201()
        {
            var client = ClientAs(AdminId, "OrgAdmin");

            var response = await client.PostAsync("/api/resources",
                Json(@"{""name"":""Projetor"",""description"":""Full HD""}"));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created),
                await response.Content.ReadAsStringAsync());
        }

        [Test]
        public async Task Post_CarimbaTenantDoToken()
        {
            var client = ClientAs(AdminId, "OrgAdmin");

            await client.PostAsync("/api/resources", Json(@"{""name"":""Projetor""}"));

            await using var db = TestDatabaseFixture.CreateContext();
            Assert.That(db.Resources.Single().TenantId, Is.EqualTo(Tenant));
        }

        [Test]
        public async Task Post_SemNome_Retorna400()
        {
            var client = ClientAs(AdminId, "OrgAdmin");

            var response = await client.PostAsync("/api/resources", Json(@"{""description"":""sem nome""}"));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        }

        [Test]
        public async Task Post_ComoMember_Retorna403()
        {
            var client = ClientAs(MemberId, "Member");

            var response = await client.PostAsync("/api/resources", Json(@"{""name"":""Projetor""}"));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        }

        [Test]
        public async Task Put_SemTenantId_Retorna200()
        {
            var client = ClientAs(AdminId, "OrgAdmin");
            var created = await client.PostAsync("/api/resources",
                Json(@"{""name"":""Projetor"",""description"":""Full HD""}"));
            var id = JsonDocument.Parse(await created.Content.ReadAsStringAsync())
                .RootElement.GetProperty("id").GetString()!;

            var response = await client.PutAsync("/api/resources",
                Json($@"{{""id"":""{id}"",""name"":""Projetor 4K"",""description"":""4K""}}"));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK),
                await response.Content.ReadAsStringAsync());
            await using var db = TestDatabaseFixture.CreateContext();
            Assert.That(db.Resources.Single().Name, Is.EqualTo("Projetor 4K"));
        }

        [Test]
        public async Task Put_Inexistente_Retorna404()
        {
            var client = ClientAs(AdminId, "OrgAdmin");

            var response = await client.PutAsync("/api/resources",
                Json(@"{""id"":""00000000-0000-0000-0000-000000000000"",""name"":""Fantasma""}"));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
        }
    }
}
