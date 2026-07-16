using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using api.Models;
using api.Services;
using NUnit.Framework;

namespace api.Tests.Endpoints;

// Pipeline HTTP de /api/invitations. O aceite é anônimo e cria conta — vale garantir que
// a rota siga aberta (um [Authorize] herdado por engano a quebraria em silêncio) e que
// convidar continue restrito a OrgAdmin.
[TestFixture]
public class InvitationsEndpointTests
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
    public async Task SetUp()
    {
        await TestDatabaseFixture.ResetAsync();

        await using var db = TestDatabaseFixture.CreateContext();
        db.Users.Add(new User
        {
            Id = AdminId,
            Name = "Ana Admin",
            Email = "ana@exemplo.com.br",
            Password = PasswordHasher.Hash("Senha#Admin1"),
            Role = Role.OrgAdmin,
        });
        db.Users.Add(new User
        {
            Id = MemberId,
            Name = "João Silva",
            Email = "joao@exemplo.com.br",
            Password = PasswordHasher.Hash("Senha#Member1"),
            Role = Role.Member,
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

    private async Task<string> InviteAsync(string email = "convidado@exemplo.com.br")
    {
        var response = await ClientAs(AdminId, "OrgAdmin").PostAsync("/api/invitations",
            Json($@"{{""email"":""{email}"",""role"":""Member""}}"));
        var body = await response.Content.ReadAsStringAsync();
        return JsonDocument.Parse(body).RootElement.GetProperty("token").GetString()!;
    }

    [Test]
    public async Task Create_ComoAdmin_Retorna200EDevolveOToken()
    {
        var response = await ClientAs(AdminId, "OrgAdmin").PostAsync("/api/invitations",
            Json(@"{""email"":""convidado@exemplo.com.br"",""role"":""Member""}"));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK),
            await response.Content.ReadAsStringAsync());
        var body = await response.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain("token"), "O token bruto volta na resposta (fallback do painel).");
    }

    [Test]
    public async Task Create_ComoMember_Retorna403()
    {
        var response = await ClientAs(MemberId, "Member").PostAsync("/api/invitations",
            Json(@"{""email"":""convidado@exemplo.com.br"",""role"":""Member""}"));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    // Só o hash vai para o banco; o token bruto existe apenas na resposta e no e-mail.
    [Test]
    public async Task Create_PersisteApenasOHashDoToken()
    {
        var token = await InviteAsync();

        await using var db = TestDatabaseFixture.CreateContext();
        var convite = db.Invitations.Single();
        Assert.That(convite.TokenHash, Is.Not.EqualTo(token));
        Assert.That(convite.TenantId, Is.EqualTo(Tenant));
    }

    [Test]
    public async Task Create_ComoPlatformOwner_Retorna400()
    {
        var response = await ClientAs(AdminId, "OrgAdmin").PostAsync("/api/invitations",
            Json(@"{""email"":""dono@exemplo.com.br"",""role"":""PlatformOwner""}"));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest),
            "Convidar como PlatformOwner não é permitido.");
    }

    // A rota de aceite é anônima de propósito: quem foi convidado ainda não tem conta.
    [Test]
    public async Task Accept_SemToken_NaoExige401()
    {
        var token = await InviteAsync();
        var client = _factory.CreateClient();

        var response = await client.PostAsync("/api/invitations/accept",
            Json($@"{{""token"":{JsonSerializer.Serialize(token)},""name"":""Convidado"",""password"":""Senha#123""}}"));

        Assert.That(response.StatusCode, Is.Not.EqualTo(HttpStatusCode.Unauthorized));
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK),
            await response.Content.ReadAsStringAsync());
    }

    [Test]
    public async Task Accept_CriaOUsuarioNoTenantDoConvite()
    {
        var token = await InviteAsync();

        await _factory.CreateClient().PostAsync("/api/invitations/accept",
            Json($@"{{""token"":{JsonSerializer.Serialize(token)},""name"":""Convidado"",""password"":""Senha#123""}}"));

        await using var db = TestDatabaseFixture.CreateContext();
        var novo = db.Users.Single(u => u.Email == "convidado@exemplo.com.br");
        Assert.That(novo.TenantId, Is.EqualTo(Tenant));
        Assert.That(novo.Role, Is.EqualTo(Role.Member));
        Assert.That(PasswordHasher.Verify("Senha#123", novo.Password), Is.True);
    }

    [Test]
    public async Task Accept_UsoUnico_SegundaTentativaFalha()
    {
        var token = await InviteAsync();
        var client = _factory.CreateClient();
        var body = $@"{{""token"":{JsonSerializer.Serialize(token)},""name"":""Convidado"",""password"":""Senha#123""}}";

        await client.PostAsync("/api/invitations/accept", Json(body));
        var segunda = await client.PostAsync("/api/invitations/accept", Json(body));

        Assert.That(segunda.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Accept_TokenInvalido_Retorna400()
    {
        var response = await _factory.CreateClient().PostAsync("/api/invitations/accept",
            Json(@"{""token"":""nao-existe"",""name"":""Fulano"",""password"":""Senha#123""}"));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }
}
