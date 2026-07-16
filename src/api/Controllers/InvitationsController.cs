using System.Security.Claims;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/invitations")]
[Authorize]
public class InvitationsController : ControllerBase
{
    private readonly InvitationsService _service;

    public InvitationsController(InvitationsService service)
    {
        _service = service;
    }

    // OrgAdmin convida alguém para o próprio tenant (o tenant vem do contexto do request).
    [HttpPost]
    [Authorize(Policy = "OrgAdmin")]
    public async Task<IActionResult> Create([FromBody] InviteRequest request)
    {
        var invitedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        try
        {
            var result = await _service.CreateAsync(request.Email, request.Role, invitedBy);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // Aceite público: o convidado define nome e senha; o usuário nasce no tenant do convite.
    [HttpPost("accept")]
    [AllowAnonymous]
    public async Task<IActionResult> Accept([FromBody] AcceptInvitationRequest request)
    {
        try
        {
            var user = await _service.AcceptAsync(request);
            if (user is null)
            {
                return BadRequest(new { message = "Convite inválido ou expirado." });
            }
            return Ok(new { id = user.Id, email = user.Email });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
