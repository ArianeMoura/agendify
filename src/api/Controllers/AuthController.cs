using api.Models;
using api.Services;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);

        if (response == null)
        {
            return Unauthorized(new { message = "Email ou senha inválidos" });
        }

        return Ok(response);
    }

    // Troca o refresh token por um novo par (access + refresh rotacionado).
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
    {
        var response = await _authService.RefreshAsync(request.RefreshToken);

        if (response == null)
        {
            return Unauthorized(new { message = "Refresh token inválido ou expirado" });
        }

        return Ok(response);
    }

    // Logout: revoga o refresh token apresentado.
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest request)
    {
        await _authService.RevokeAsync(request.RefreshToken);
        return NoContent();
    }
}
