using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace api.Services;

public class AuthService
{
    private readonly JwtSettings _jwtSettings;
    private readonly UsersService _usersService;
    private readonly AppDbContext _db;

    public AuthService(IOptions<JwtSettings> jwtSettings, UsersService usersService, AppDbContext db)
    {
        _jwtSettings = jwtSettings.Value;
        _usersService = usersService;
        _db = db;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _usersService.GetByEmailAsync(request.Email);

        // Conta anonimizada (LGPD) não autentica.
        if (user is null || user.AnonymizedAt is not null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            return null;

        return await IssueSessionAsync(user);
    }

    // Troca um refresh token válido por um novo par (rotação): revoga o atual e
    // emite outro. Se o token for inválido/expirado/revogado, retorna null.
    public async Task<LoginResponse?> RefreshAsync(string rawRefreshToken)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken)) return null;

        var hash = Hash(rawRefreshToken);
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);

        if (stored is null || !stored.IsActive) return null;

        var user = await _usersService.GetByIdAsync(stored.UserId);
        if (user is null || user.AnonymizedAt is not null) return null;

        stored.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await IssueSessionAsync(user);
    }

    public async Task RevokeAsync(string rawRefreshToken)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken)) return;

        var hash = Hash(rawRefreshToken);
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);
        if (stored is not null && stored.RevokedAt is null)
        {
            stored.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    private async Task<LoginResponse> IssueSessionAsync(User user)
    {
        var accessToken = GenerateJwtToken(user);
        var expiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationInMinutes);

        var rawRefresh = GenerateSecureToken();
        _db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid().ToString(),
            UserId = user.Id!,
            TokenHash = Hash(rawRefresh),
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenDays),
        });
        await _db.SaveChangesAsync();

        return new LoginResponse
        {
            Token = accessToken,
            ExpiresAt = expiresAt,
            RefreshToken = rawRefresh,
            User = MapToUserDto(user),
        };
    }

    private string GenerateJwtToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_jwtSettings.Secret);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id!),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.Profile.ToString())
            }),
            Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationInMinutes),
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    // 256 bits de entropia; o valor bruto só existe no cliente. No banco guardamos o hash.
    private static string GenerateSecureToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

    private static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    private static UserDto MapToUserDto(User user) => new()
    {
        Id = user.Id!,
        Name = user.Name,
        Email = user.Email,
        Profile = user.Profile,
        CreatedAt = user.CreatedAt
    };
}
