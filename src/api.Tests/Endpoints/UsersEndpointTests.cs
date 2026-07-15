using System.Net;
using System.Net.Http.Headers;
using System.Text;
using api.Models;
using api.Services;
using NUnit.Framework;

namespace api.Tests.Endpoints
{
    // Pipeline HTTP de /api/users. O foco é a autorização: GetById e Update não têm política
    // de role no atributo — o ownership é checado à mão dentro da action. Sem teste de
    // endpoint isso nunca foi exercitado, e é o tipo de regra que some num refactor.
    [TestFixture]
    public class UsersEndpointTests
    {
        private const string AdminId = "55555555-5555-5555-5555-555555555555";
        private const string MemberId = "11111111-1111-1111-1111-111111111111";
        private const string OutroMemberId = "44444444-4444-4444-4444-444444444444";
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
                Id = AdminId, Name = "Ana Admin", Email = "ana@exemplo.com.br",
                Password = PasswordHasher.Hash("Senha#Admin1"), Role = Role.OrgAdmin,
            });
            db.Users.Add(new User
            {
                Id = MemberId, Name = "João Silva", Email = "joao@exemplo.com.br",
                Password = PasswordHasher.Hash("Senha#Member1"), Role = Role.Member,
            });
            db.Users.Add(new User
            {
                Id = OutroMemberId, Name = "Maria Souza", Email = "maria@exemplo.com.br",
                Password = PasswordHasher.Hash("Senha#Member2"), Role = Role.Member,
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

        [Test]
        public async Task GetAll_ComoMember_Retorna403()
        {
            var response = await ClientAs(MemberId, "Member").GetAsync("/api/users");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        }

        [Test]
        public async Task GetAll_ComoAdmin_Retorna200()
        {
            var response = await ClientAs(AdminId, "OrgAdmin").GetAsync("/api/users");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        }

        // A listagem nunca pode devolver o hash da senha.
        [Test]
        public async Task GetAll_NaoExpoeSenha()
        {
            var response = await ClientAs(AdminId, "OrgAdmin").GetAsync("/api/users");

            var body = await response.Content.ReadAsStringAsync();
            Assert.That(body.ToLowerInvariant(), Does.Not.Contain("password"));
            Assert.That(body, Does.Not.Contain("$2a$"), "Hash BCrypt não pode vazar na resposta.");
        }

        [Test]
        public async Task GetById_OProprioUsuario_Retorna200()
        {
            var response = await ClientAs(MemberId, "Member").GetAsync($"/api/users/{MemberId}");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        }

        [Test]
        public async Task GetById_DeOutroUsuario_ComoMember_Retorna403()
        {
            var response = await ClientAs(MemberId, "Member").GetAsync($"/api/users/{OutroMemberId}");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        }

        [Test]
        public async Task Create_ComoMember_Retorna403()
        {
            var response = await ClientAs(MemberId, "Member").PostAsync("/api/users",
                Json(@"{""name"":""Novo"",""email"":""novo@exemplo.com.br"",""password"":""Senha#123"",""role"":""Member""}"));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        }

        [Test]
        public async Task Create_ComoAdmin_CarimbaTenantENaoGuardaSenhaEmTextoPlano()
        {
            var response = await ClientAs(AdminId, "OrgAdmin").PostAsync("/api/users",
                Json(@"{""name"":""Novo"",""email"":""novo@exemplo.com.br"",""password"":""Senha#123"",""role"":""Member""}"));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created),
                await response.Content.ReadAsStringAsync());

            await using var db = TestDatabaseFixture.CreateContext();
            var criado = db.Users.Single(u => u.Email == "novo@exemplo.com.br");
            Assert.That(criado.TenantId, Is.EqualTo(Tenant));
            Assert.That(criado.Password, Is.Not.EqualTo("Senha#123"));
            Assert.That(PasswordHasher.Verify("Senha#123", criado.Password), Is.True);
        }

        // O caso mais sensível: um Member não pode trocar a senha de outra pessoa.
        [Test]
        public async Task Update_DeOutroUsuario_ComoMember_Retorna403()
        {
            var response = await ClientAs(MemberId, "Member").PutAsync($"/api/users/{OutroMemberId}",
                Json(@"{""password"":""SenhaInvadida#1""}"));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));

            await using var db = TestDatabaseFixture.CreateContext();
            var vitima = db.Users.Single(u => u.Id == OutroMemberId);
            Assert.That(PasswordHasher.Verify("Senha#Member2", vitima.Password), Is.True,
                "A senha da outra pessoa não pode ter sido trocada.");
        }

        [Test]
        public async Task Update_AProrpiaSenha_Retorna204()
        {
            var response = await ClientAs(MemberId, "Member").PutAsync($"/api/users/{MemberId}",
                Json(@"{""password"":""MinhaNova#1""}"));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            await using var db = TestDatabaseFixture.CreateContext();
            Assert.That(PasswordHasher.Verify("MinhaNova#1", db.Users.Single(u => u.Id == MemberId).Password),
                Is.True);
        }

        // Autoescalonamento: Member não vira OrgAdmin sozinho.
        [Test]
        public async Task Update_MemberTentandoVirarAdmin_Retorna403()
        {
            var response = await ClientAs(MemberId, "Member").PutAsync($"/api/users/{MemberId}",
                Json(@"{""role"":""OrgAdmin""}"));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
            await using var db = TestDatabaseFixture.CreateContext();
            Assert.That(db.Users.Single(u => u.Id == MemberId).Role, Is.EqualTo(Role.Member));
        }

        [Test]
        public async Task Delete_ComoMember_Retorna403()
        {
            var response = await ClientAs(MemberId, "Member").DeleteAsync($"/api/users/{OutroMemberId}");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        }

        [Test]
        public async Task Delete_ComoAdmin_Retorna204()
        {
            var response = await ClientAs(AdminId, "OrgAdmin").DeleteAsync($"/api/users/{OutroMemberId}");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
        }

        [Test]
        public async Task SemToken_Retorna401()
        {
            var response = await _factory.CreateClient().GetAsync("/api/users");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
        }
    }
}
