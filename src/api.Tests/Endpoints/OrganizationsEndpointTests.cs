using System.Net;
using System.Text;
using api.Models;
using api.Services;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace api.Tests.Endpoints
{
    // Pipeline HTTP de /api/organizations — o self-signup. É o único ponto anônimo que cria
    // dados na API, e ele cria um tenant inteiro mais o primeiro OrgAdmin. Se a rota deixasse
    // de ser anônima, o cadastro morria em silêncio; se deixasse de ser restrita, viraria
    // porta para criar admin em tenant alheio.
    [TestFixture]
    public class OrganizationsEndpointTests
    {
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

        private static StringContent Json(string body) => new(body, Encoding.UTF8, "application/json");

        private const string Signup =
            @"{""organizationName"":""Condomínio Acácias"",""adminName"":""Ana"",
               ""adminEmail"":""ana@acacias.com.br"",""adminPassword"":""Senha#123""}";

        [Test]
        public async Task Create_SemAutenticacao_Retorna201()
        {
            var response = await _factory.CreateClient().PostAsync("/api/organizations", Json(Signup));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created),
                await response.Content.ReadAsStringAsync());
        }

        [Test]
        public async Task Create_CriaOTenantEOPrimeiroAdminNele()
        {
            await _factory.CreateClient().PostAsync("/api/organizations", Json(Signup));

            // Cross-tenant: o tenant acabou de nascer e o contexto de teste não o conhece.
            await using var db = TestDatabaseFixture.CreateContext(tenantId: null, isPlatformOwner: true);
            var org = await db.Organizations.SingleAsync(o => o.Slug != "default");
            var admin = await db.Users.SingleAsync(u => u.Email == "ana@acacias.com.br");

            Assert.That(admin.TenantId, Is.EqualTo(org.Id), "O admin nasce dentro da própria organização.");
            Assert.That(admin.Role, Is.EqualTo(Role.OrgAdmin));
            Assert.That(PasswordHasher.Verify("Senha#123", admin.Password), Is.True);
        }

        [Test]
        public async Task Create_ComEmailJaCadastrado_Retorna400()
        {
            var client = _factory.CreateClient();
            await client.PostAsync("/api/organizations", Json(Signup));

            var segunda = await client.PostAsync("/api/organizations", Json(Signup));

            Assert.That(segunda.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        }

        [Test]
        public async Task Create_SemCamposObrigatorios_Retorna400()
        {
            var response = await _factory.CreateClient().PostAsync("/api/organizations",
                Json(@"{""organizationName"":""Só o nome""}"));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        }

        [Test]
        public async Task Create_ComSenhaCurta_Retorna400()
        {
            var response = await _factory.CreateClient().PostAsync("/api/organizations",
                Json(@"{""organizationName"":""Org"",""adminName"":""Ana"",
                        ""adminEmail"":""ana@org.com.br"",""adminPassword"":""123""}"));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        }

        // Depois do signup dá para entrar com as credenciais escolhidas: fecha o ciclo.
        [Test]
        public async Task Create_PermiteLoginEmSeguida()
        {
            var client = _factory.CreateClient();
            await client.PostAsync("/api/organizations", Json(Signup));

            var login = await client.PostAsync("/api/auth/login",
                Json(@"{""email"":""ana@acacias.com.br"",""password"":""Senha#123""}"));

            Assert.That(login.StatusCode, Is.EqualTo(HttpStatusCode.OK),
                await login.Content.ReadAsStringAsync());
        }
    }
}
