using api.Models;
using api.Services;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly PasswordResetService _passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService)
    {
        _authService = authService;
        _passwordResetService = passwordResetService;
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

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest request)
    {
        await _authService.RevokeAsync(request.RefreshToken);
        return NoContent();
    }

    // RF-003. Responde 202 sempre — inclusive para e-mail que não existe. Distinguir os casos
    // transformaria o endpoint num oráculo de quem tem conta na plataforma.
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        await _passwordResetService.RequestAsync(request.Email);

        return Accepted(new
        {
            message = "Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha."
        });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var ok = await _passwordResetService.ResetAsync(request.Token, request.Password);

        if (!ok)
        {
            // Sem detalhar se o token não existe, expirou ou já foi usado.
            return BadRequest(new { message = "Link inválido ou expirado. Peça um novo." });
        }

        return NoContent();
    }
}
