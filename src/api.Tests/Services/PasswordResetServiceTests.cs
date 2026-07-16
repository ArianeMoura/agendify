using api.Data;
using api.Models;
using api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NUnit.Framework;

namespace api.Tests.Services;

// Recuperação de senha (RF-003). O foco é o que o SECURITY.md exige: token de uso único,
// expiração curta, invalidação após o uso — e não vazar quais e-mails existem.
[TestFixture]
public class PasswordResetServiceTests
{
    private const string UserId = "11111111-1111-1111-1111-111111111111";
    private const string Email = "joao@exemplo.com.br";
    private const string SenhaAntiga = "SenhaAntiga#1";
    private const string SenhaNova = "SenhaNova#2";

    // Captura o link em vez de enviar e-mail.
    private class FakeEmailSender : IEmailSender
    {
        public string? ResetLink;
        public string? SentTo;
        public DateTime? ExpiresAt;
        public int Sends;

        public Task SendInvitationAsync(string toEmail, string acceptLink, DateTime expiresAt, CancellationToken ct = default) =>
            Task.CompletedTask;

        public Task SendPasswordResetAsync(string toEmail, string resetLink, DateTime expiresAt, CancellationToken ct = default)
        {
            Sends++;
            SentTo = toEmail;
            ResetLink = resetLink;
            ExpiresAt = expiresAt;
            return Task.CompletedTask;
        }
    }

    private FakeEmailSender _email = null!;

    [SetUp]
    public async Task SetUp()
    {
        await TestDatabaseFixture.ResetAsync();
        _email = new FakeEmailSender();

        await using var db = TestDatabaseFixture.CreateContext();
        db.Users.Add(new User
        {
            Id = UserId,
            Name = "João Silva",
            Email = Email,
            Password = PasswordHasher.Hash(SenhaAntiga),
            Role = Role.Member,
        });
        await db.SaveChangesAsync();
    }

    private PasswordResetService NewService(AppDbContext db) =>
        new(db, _email, Options.Create(new AppSettings { BaseUrl = "https://painel.test" }),
            NullLogger<PasswordResetService>.Instance);

    // O token bruto só existe no link; o banco guarda o hash.
    private static string TokenFromLink(string link) =>
        Uri.UnescapeDataString(link.Split("token=")[1]);

    private async Task<string> RequestTokenAsync()
    {
        await using var db = TestDatabaseFixture.CreateContext();
        await NewService(db).RequestAsync(Email);
        return TokenFromLink(_email.ResetLink!);
    }

    [Test]
    public async Task RequestAsync_EnviaLinkComTokenEPersisteApenasOHash()
    {
        await using var db = TestDatabaseFixture.CreateContext();

        await NewService(db).RequestAsync(Email);

        Assert.That(_email.SentTo, Is.EqualTo(Email));
        Assert.That(_email.ResetLink, Does.StartWith("https://painel.test/reset-password?token="));

        await using var check = TestDatabaseFixture.CreateContext();
        var saved = check.PasswordResetTokens.Single();
        var rawToken = TokenFromLink(_email.ResetLink!);
        Assert.That(saved.TokenHash, Is.Not.EqualTo(rawToken), "O token bruto não pode ir para o banco.");
        Assert.That(saved.UserId, Is.EqualTo(UserId));
        Assert.That(saved.TenantId, Is.EqualTo(Organization.DefaultOrganizationId),
            "Fluxo anônimo: o tenant precisa ser setado explicitamente.");
    }

    // Não vaza cadastro: e-mail desconhecido não envia nada e não estoura erro.
    [Test]
    public async Task RequestAsync_NaoRevelaQuandoOEmailNaoExiste()
    {
        await using var db = TestDatabaseFixture.CreateContext();

        Assert.DoesNotThrowAsync(async () => await NewService(db).RequestAsync("ninguem@exemplo.com.br"));

        Assert.That(_email.Sends, Is.Zero);
        await using var check = TestDatabaseFixture.CreateContext();
        Assert.That(check.PasswordResetTokens.Count(), Is.Zero);
    }

    [Test]
    public async Task RequestAsync_IgnoraUsuarioAnonimizado()
    {
        await using (var seed = TestDatabaseFixture.CreateContext())
        {
            var user = await seed.Users.FirstAsync(u => u.Id == UserId);
            user.AnonymizedAt = DateTime.UtcNow;
            await seed.SaveChangesAsync();
        }

        await using var db = TestDatabaseFixture.CreateContext();
        await NewService(db).RequestAsync(Email);

        Assert.That(_email.Sends, Is.Zero);
    }

    [Test]
    public async Task ResetAsync_TrocaASenha_ComTokenValido()
    {
        var token = await RequestTokenAsync();

        await using var db = TestDatabaseFixture.CreateContext();
        var ok = await NewService(db).ResetAsync(token, SenhaNova);

        Assert.That(ok, Is.True);
        await using var check = TestDatabaseFixture.CreateContext();
        var user = check.Users.Single(u => u.Id == UserId);
        Assert.That(PasswordHasher.Verify(SenhaNova, user.Password), Is.True, "A senha nova deveria valer.");
        Assert.That(PasswordHasher.Verify(SenhaAntiga, user.Password), Is.False, "A senha antiga não pode mais valer.");
    }

    [Test]
    public async Task ResetAsync_UsoUnico_SegundaTentativaFalha()
    {
        var token = await RequestTokenAsync();

        await using (var first = TestDatabaseFixture.CreateContext())
            Assert.That(await NewService(first).ResetAsync(token, SenhaNova), Is.True);

        await using var second = TestDatabaseFixture.CreateContext();
        Assert.That(await NewService(second).ResetAsync(token, "OutraSenha#3"), Is.False,
            "O token já foi usado.");
    }

    [Test]
    public async Task ResetAsync_FalhaComTokenExpirado()
    {
        var token = await RequestTokenAsync();

        await using (var seed = TestDatabaseFixture.CreateContext())
        {
            var saved = await seed.PasswordResetTokens.FirstAsync();
            saved.ExpiresAt = DateTime.UtcNow.AddMinutes(-1);
            await seed.SaveChangesAsync();
        }

        await using var db = TestDatabaseFixture.CreateContext();
        Assert.That(await NewService(db).ResetAsync(token, SenhaNova), Is.False);
    }

    [Test]
    public async Task ResetAsync_FalhaComTokenInexistente()
    {
        await using var db = TestDatabaseFixture.CreateContext();

        Assert.That(await NewService(db).ResetAsync("token-que-nunca-existiu", SenhaNova), Is.False);
    }

    // Pedir de novo invalida o link anterior — senão um e-mail antigo interceptado ainda abriria a conta.
    [Test]
    public async Task RequestAsync_InvalidaOsPedidosAnteriores()
    {
        var primeiro = await RequestTokenAsync();
        var segundo = await RequestTokenAsync();

        await using var db = TestDatabaseFixture.CreateContext();
        var svc = NewService(db);

        Assert.That(await svc.ResetAsync(primeiro, SenhaNova), Is.False, "O link antigo não deveria mais valer.");
        await using var db2 = TestDatabaseFixture.CreateContext();
        Assert.That(await NewService(db2).ResetAsync(segundo, SenhaNova), Is.True, "O link mais recente deveria valer.");
    }

    // Trocar a senha derruba as sessões abertas.
    [Test]
    public async Task ResetAsync_RevogaOsRefreshTokensAtivos()
    {
        await using (var seed = TestDatabaseFixture.CreateContext())
        {
            seed.RefreshTokens.Add(new RefreshToken
            {
                Id = Guid.NewGuid().ToString(),
                TenantId = Organization.DefaultOrganizationId,
                UserId = UserId,
                TokenHash = "hash-de-sessao",
                ExpiresAt = DateTime.UtcNow.AddDays(30),
            });
            await seed.SaveChangesAsync();
        }

        var token = await RequestTokenAsync();
        await using var db = TestDatabaseFixture.CreateContext();
        await NewService(db).ResetAsync(token, SenhaNova);

        await using var check = TestDatabaseFixture.CreateContext();
        Assert.That(check.RefreshTokens.Single().RevokedAt, Is.Not.Null,
            "A sessão aberta deveria ter sido revogada.");
    }

    [Test]
    public async Task RequestAsync_TokenExpiraEm30Minutos()
    {
        await using var db = TestDatabaseFixture.CreateContext();

        await NewService(db).RequestAsync(Email);

        Assert.That(_email.ExpiresAt, Is.EqualTo(DateTime.UtcNow.AddMinutes(30)).Within(1).Minutes);
    }
}
