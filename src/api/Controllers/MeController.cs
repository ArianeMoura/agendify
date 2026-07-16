using System.Security.Claims;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

// Direitos do titular sobre os próprios dados (LGPD). Todos os endpoints
// operam exclusivamente sobre o usuário autenticado (self-service).
[ApiController]
[Route("api/me")]
[Authorize]
public class MeController : ControllerBase
{
    private readonly PrivacyService _privacyService;

    public MeController(PrivacyService privacyService)
    {
        _privacyService = privacyService;
    }

    private string? CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    // Registra o aceite do termo de consentimento vigente (versionado).
    [HttpPost("consent")]
    public async Task<IActionResult> Consent([FromBody] ConsentRequest request)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        await _privacyService.RecordConsentAsync(userId, request.Version);
        return NoContent();
    }

    // Exporta todos os dados pessoais do titular (acesso/portabilidade).
    [HttpGet("data-export")]
    public async Task<IActionResult> Export()
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var data = await _privacyService.ExportAsync(userId);
        if (data is null) return NotFound();
        return Ok(data);
    }

    // Apagamento por anonimização. Preserva a reserva agregada, remove PII.
    [HttpDelete]
    public async Task<IActionResult> Delete()
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var ok = await _privacyService.AnonymizeAsync(userId);
        if (!ok) return NotFound();
        return Ok(new { message = "Conta anonimizada. Suas informações pessoais foram removidas." });
    }
}
