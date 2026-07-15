using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using api.Data;
using api.Models;
using api.Tenancy;
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
        // Login é PRÉ-tenant: acha o usuário (cross-tenant) e grava o refresh token no
        // tenant dele — o escopo desliga o filtro EF e o RLS por toda a operação.
        using var crossTenant = _db.Tenant.EnterCrossTenant();

        var user = await _usersService.GetByEmailAsync(request.Email);

        // Conta anonimizada (LGPD) não autentica.
        if (user is null || user.AnonymizedAt is not null || !PasswordHasher.Verify(request.Password, user.Password))
            return null;

        return await IssueSessionAsync(user);
    }

    // Troca um refresh token válido por um novo par (rotação): revoga o atual e
    // emite outro. Se o token for inválido/expirado/revogado, retorna null.
    public async Task<LoginResponse?> RefreshAsync(string rawRefreshToken)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken)) return null;

        // Refresh é PRÉ-tenant: o token identifica o usuário (e o tenant) antes de
        // qualquer contexto estar resolvido. Escopo cross-tenant por toda a operação.
        using var crossTenant = _db.Tenant.EnterCrossTenant();

        var hash = Hash(rawRefreshToken);
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);

        if (stored is null || !stored.IsActive) return null;

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == stored.UserId);
        if (user is null || user.AnonymizedAt is not null) return null;

        stored.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await IssueSessionAsync(user);
    }

    public async Task RevokeAsync(string rawRefreshToken)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken)) return;

        using var crossTenant = _db.Tenant.EnterCrossTenant();

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
            // Setado explicitamente: login/refresh são anônimos, então o auto-stamp do
            // AppDbContext (que lê o tenant do request) não teria de onde preencher.
            TenantId = user.TenantId,
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
        // UTF-8 para casar com a validação em Program.cs (antes era ASCII aqui e UTF-8
        // lá — inofensivo só enquanto o secret fosse ASCII puro; agora está consistente).
        var key = Encoding.UTF8.GetBytes(_jwtSettings.Secret);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id!),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                // Tenant do usuário: é o que o middleware injeta no ITenantContext para
                // filtrar toda query por tenant. Sem isso, não há isolamento por request.
                new Claim(TenantClaims.TenantId, user.TenantId)
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
        Role = user.Role,
        CreatedAt = user.CreatedAt
    };
}
