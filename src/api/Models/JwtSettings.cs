namespace api.Models;

public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    // Vida do access token (curta). Refresh token cobre a sessão longa.
    public int ExpirationInMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 30;
}
