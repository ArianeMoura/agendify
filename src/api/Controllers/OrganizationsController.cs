using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/organizations")]
public class OrganizationsController : ControllerBase
{
    private readonly OrganizationsService _service;

    public OrganizationsController(OrganizationsService service)
    {
        _service = service;
    }

    // Self-signup público: cria a organização + o primeiro OrgAdmin. É o único ponto
    // anônimo que cria dados (como assinar um SaaS). Substitui o antigo cadastro
    // anônimo de usuário (que permitia virar admin sem tenant).
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateOrganizationRequest request)
    {
        try
        {
            var result = await _service.SignUpAsync(request);
            return CreatedAtAction(nameof(Create), new { id = result.OrganizationId }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
