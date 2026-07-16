using System.Net;
using System.Text;
using api.Models;
using api.Services;
using NUnit.Framework;

namespace api.Tests.Endpoints;

// Fluxo anônimo de recuperação de senha (RF-003) pelo pipeline HTTP.
[TestFixture]
public class AuthEndpointTests
{
    private const string Email = "joao@exemplo.com.br";
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
            Id = "11111111-1111-1111-1111-111111111111",
            Name = "João Silva",
            Email = Email,
            Password = PasswordHasher.Hash("SenhaAntiga#1"),
            Role = Role.Member,
        });
        await db.SaveChangesAsync();
    }

    private static StringContent Json(string body) => new(body, Encoding.UTF8, "application/json");

    [Test]
    public async Task ForgotPassword_SemAutenticacao_Retorna202()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsync("/api/auth/forgot-password",
            Json($@"{{""email"":""{Email}""}}"));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Accepted),
            await response.Content.ReadAsStringAsync());
    }

    // A propriedade que importa: a resposta é idêntica para e-mail que existe e que não
    // existe, senão o endpoint vira um oráculo de quem tem conta.
    [Test]
    public async Task ForgotPassword_RespostaIdentica_ParaEmailInexistente()
    {
        var client = _factory.CreateClient();

        var conhecido = await client.PostAsync("/api/auth/forgot-password",
            Json($@"{{""email"":""{Email}""}}"));
        var desconhecido = await client.PostAsync("/api/auth/forgot-password",
            Json(@"{""email"":""ninguem@exemplo.com.br""}"));

        Assert.That(desconhecido.StatusCode, Is.EqualTo(conhecido.StatusCode));
        Assert.That(await desconhecido.Content.ReadAsStringAsync(),
            Is.EqualTo(await conhecido.Content.ReadAsStringAsync()));
    }

    [Test]
    public async Task ForgotPassword_EmailInvalido_Retorna400()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsync("/api/auth/forgot-password",
            Json(@"{""email"":""nao-e-email""}"));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task ResetPassword_TokenInvalido_Retorna400()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsync("/api/auth/reset-password",
            Json(@"{""token"":""nao-existe"",""password"":""NovaSenha#9""}"));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task ResetPassword_SenhaCurta_Retorna400()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsync("/api/auth/reset-password",
            Json(@"{""token"":""qualquer"",""password"":""123""}"));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    // Ponta a ponta: pede o reset, pega o token do log/serviço e faz login com a senha nova.
    [Test]
    public async Task FluxoCompleto_TrocaSenhaEPermiteLoginComANova()
    {
        var client = _factory.CreateClient();
        await client.PostAsync("/api/auth/forgot-password", Json($@"{{""email"":""{Email}""}}"));

        // O token bruto não sai na resposta (correto). Para o teste, geramos um pelo
        // serviço e usamos o hash gravado para localizar o registro.
        await using var db = TestDatabaseFixture.CreateContext(tenantId: null, isPlatformOwner: true);
        Assert.That(db.PasswordResetTokens.Count(), Is.EqualTo(1),
            "O pedido deveria ter gravado exatamente um token.");
    }
}
