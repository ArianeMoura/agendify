namespace api.Models;

public class LoginResponse
{
    // Access token de vida curta.
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    // Refresh token rotativo (valor bruto — só retornado aqui, nunca persistido).
    public string RefreshToken { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
}
