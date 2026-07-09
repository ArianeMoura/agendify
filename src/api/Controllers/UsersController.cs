using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UsersService _usersService;

    public UsersController(UsersService usersService)
    {
        _usersService = usersService;
    }

    // Admin do tenant: OrgAdmin ou PlatformOwner (que herda os poderes de OrgAdmin).
    private bool IsAdmin() => User.IsInRole("OrgAdmin") || User.IsInRole("PlatformOwner");

    [HttpGet]
    [Authorize(Policy = "OrgAdmin")]
    public async Task<ActionResult<List<UserDto>>> GetAll()
    {
        var users = await _usersService.GetAsync();
        var usersDto = users.Select(u => new UserDto
        {
            Id = u.Id!,
            Name = u.Name,
            Email = u.Email,
            Role = u.Role,
            CreatedAt = u.CreatedAt
        }).ToList();

        return Ok(usersDto);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(string id)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!IsAdmin() && currentUserId != id)
        {
            return Forbid();
        }

        var user = await _usersService.GetByIdAsync(id);

        if (user == null)
        {
            return NotFound(new { message = "Usuário não encontrado" });
        }

        var userDto = new UserDto
        {
            Id = user.Id!,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };

        return Ok(userDto);
    }

    // Criação direta de usuário pelo OrgAdmin (no próprio tenant, via auto-stamp).
    // Deixou de ser anônima: o cadastro público agora é POST /api/organizations
    // (self-signup) e o convite (POST /api/invitations). Um OrgAdmin não pode criar
    // um PlatformOwner (evita autoescalonamento acima do próprio nível).
    [HttpPost]
    [Authorize(Policy = "OrgAdmin")]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        if (request.Role == Role.PlatformOwner)
        {
            return Forbid();
        }

        var existingUser = await _usersService.GetByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return BadRequest(new { message = "Email já cadastrado" });
        }

        var newUser = new User
        {
            Name = request.Name,
            Email = request.Email,
            Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role,
            CreatedAt = DateTime.UtcNow
        };

        await _usersService.CreateAsync(newUser);

        var userDto = new UserDto
        {
            Id = newUser.Id!,
            Name = newUser.Name,
            Email = newUser.Email,
            Role = newUser.Role,
            CreatedAt = newUser.CreatedAt
        };

        return CreatedAtAction(nameof(GetById), new { id = newUser.Id }, userDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateUserRequest request)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!IsAdmin() && currentUserId != id)
        {
            return Forbid();
        }

        var user = await _usersService.GetByIdAsync(id);

        if (user == null)
        {
            return NotFound(new { message = "Usuário não encontrado" });
        }

        if (!string.IsNullOrEmpty(request.Name))
            user.Name = request.Name;

        if (!string.IsNullOrEmpty(request.Email))
        {
            var existingUser = await _usersService.GetByEmailAsync(request.Email);
            if (existingUser != null && existingUser.Id != id)
            {
                return BadRequest(new { message = "Email já cadastrado" });
            }
            user.Email = request.Email;
        }

        if (!string.IsNullOrEmpty(request.Password))
            user.Password = BCrypt.Net.BCrypt.HashPassword(request.Password);

        if (request.Role.HasValue)
        {
            // Só um admin do tenant pode alterar papel (evita autoescalonamento).
            if (!IsAdmin())
            {
                return Forbid();
            }
            user.Role = request.Role.Value;
        }

        user.UpdatedAt = DateTime.UtcNow;

        await _usersService.UpdateAsync(id, user);

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "OrgAdmin")]
    public async Task<IActionResult> Delete(string id)
    {
        var user = await _usersService.GetByIdAsync(id);

        if (user == null)
        {
            return NotFound(new { message = "Usuário não encontrado" });
        }

        await _usersService.RemoveAsync(id);

        return NoContent();
    }
}
