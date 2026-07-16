using api.Models;
using api.Services;
using Microsoft.Extensions.Options;
using NUnit.Framework;

namespace api.Tests.Services;

[TestFixture]
public class AuthServiceTests
{
    private const string Email = "user@agendify.dev";
    private const string Password = "Secret123!";

    private static readonly IOptions<JwtSettings> Jwt = Options.Create(new JwtSettings
    {
        Secret = "test-secret-com-mais-de-32-caracteres-para-hs256!!",
        Issuer = "agendify-api",
        Audience = "agendify-api-users",
        ExpirationInMinutes = 15,
        RefreshTokenDays = 30,
    });

    // Cada chamada usa seu próprio contexto (como um request scoped em produção).
    private static AuthService NewAuth()
    {
        var db = TestDatabaseFixture.CreateContext();
        return new AuthService(Jwt, new UsersService(db), db);
    }

    [SetUp]
    public async Task SetUp()
    {
        await TestDatabaseFixture.ResetAsync();
        await using var db = TestDatabaseFixture.CreateContext();
        db.Users.Add(new User
        {
            Id = Guid.NewGuid().ToString(),
            Name = "User",
            Email = Email,
            Password = BCrypt.Net.BCrypt.HashPassword(Password),
            Role = Role.Member,
        });
        await db.SaveChangesAsync();
    }

    [Test]
    public async Task Login_ShouldIssueAccessAndRefreshTokens()
    {
        var res = await NewAuth().LoginAsync(new LoginRequest { Email = Email, Password = Password });

        Assert.That(res, Is.Not.Null);
        Assert.That(res!.Token, Is.Not.Empty);
        Assert.That(res.RefreshToken, Is.Not.Empty);
    }

    [Test]
    public async Task Login_ShouldReturnNull_WhenPasswordWrong()
    {
        var res = await NewAuth().LoginAsync(new LoginRequest { Email = Email, Password = "wrong" });
        Assert.That(res, Is.Null);
    }

    [Test]
    public async Task Refresh_ShouldRotate_InvalidatingOldToken()
    {
        var login = await NewAuth().LoginAsync(new LoginRequest { Email = Email, Password = Password });
        var oldRefresh = login!.RefreshToken;

        var rotated = await NewAuth().RefreshAsync(oldRefresh);
        Assert.That(rotated, Is.Not.Null);
        Assert.That(rotated!.RefreshToken, Is.Not.EqualTo(oldRefresh));

        // O token antigo não vale mais (foi revogado na rotação).
        var reuseOld = await NewAuth().RefreshAsync(oldRefresh);
        Assert.That(reuseOld, Is.Null, "Refresh token já usado deve ser rejeitado.");

        var reuseNew = await NewAuth().RefreshAsync(rotated.RefreshToken);
        Assert.That(reuseNew, Is.Not.Null);
    }

    [Test]
    public async Task Refresh_ShouldReturnNull_ForUnknownToken()
    {
        var res = await NewAuth().RefreshAsync("token-inexistente");
        Assert.That(res, Is.Null);
    }

    [Test]
    public async Task Logout_ShouldRevokeRefreshToken()
    {
        var login = await NewAuth().LoginAsync(new LoginRequest { Email = Email, Password = Password });
        await NewAuth().RevokeAsync(login!.RefreshToken);

        var afterLogout = await NewAuth().RefreshAsync(login.RefreshToken);
        Assert.That(afterLogout, Is.Null);
    }
}
