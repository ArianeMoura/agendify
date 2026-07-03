using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace web.Services;

public class AuthService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuthService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public void SetToken(string token)
    {
        _httpContextAccessor.HttpContext?.Session.SetString("AuthToken", token);
    }

    public string? GetToken()
    {
        return _httpContextAccessor.HttpContext?.Session.GetString("AuthToken");
    }

    public void SetUser(string userId, string userName, string userEmail, string userRole)
    {
        _httpContextAccessor.HttpContext?.Session.SetString("UserId", userId);
        _httpContextAccessor.HttpContext?.Session.SetString("UserName", userName);
        _httpContextAccessor.HttpContext?.Session.SetString("UserEmail", userEmail);
        _httpContextAccessor.HttpContext?.Session.SetString("UserRole", userRole);
    }

    public string? GetUserId() => _httpContextAccessor.HttpContext?.Session.GetString("UserId");
    public string? GetUserName() => _httpContextAccessor.HttpContext?.Session.GetString("UserName");
    public string? GetUserEmail() => _httpContextAccessor.HttpContext?.Session.GetString("UserEmail");
    public string? GetUserRole() => _httpContextAccessor.HttpContext?.Session.GetString("UserRole");

    public bool IsAuthenticated() => !string.IsNullOrEmpty(GetToken());

    public bool IsAdmin() => GetUserRole() == "Administrator";

    public void Logout()
    {
        _httpContextAccessor.HttpContext?.Session.Clear();
    }

    public ClaimsPrincipal? GetClaimsPrincipal()
    {
        var token = GetToken();
        if (string.IsNullOrEmpty(token))
            return null;

        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);

        var claims = jwtToken.Claims.ToList();
        var identity = new ClaimsIdentity(claims, "jwt");
        return new ClaimsPrincipal(identity);
    }
}

