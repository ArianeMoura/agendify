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

    // GET: api/users
    [HttpGet]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<List<UserDto>>> GetAll()
    {
        var users = await _usersService.GetAsync();
        var usersDto = users.Select(u => new UserDto
        {
            Id = u.Id!,
            Name = u.Name,
            Email = u.Email,
            Profile = u.Profile,
            CreatedAt = u.CreatedAt
        }).ToList();

        return Ok(usersDto);
    }

    // GET: api/users/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(string id)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

        // Usuários comuns só podem ver seus próprios dados
        if (currentUserRole != "Administrator" && currentUserId != id)
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
            Profile = user.Profile,
            CreatedAt = user.CreatedAt
        };

        return Ok(userDto);
    }

    // POST: api/users
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        // Verificar se email já existe
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
            Profile = request.Profile,
            CreatedAt = DateTime.UtcNow
        };

        await _usersService.CreateAsync(newUser);

        var userDto = new UserDto
        {
            Id = newUser.Id!,
            Name = newUser.Name,
            Email = newUser.Email,
            Profile = newUser.Profile,
            CreatedAt = newUser.CreatedAt
        };

        return CreatedAtAction(nameof(GetById), new { id = newUser.Id }, userDto);
    }

    // PUT: api/users/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateUserRequest request)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

        // Usuários comuns só podem editar seus próprios dados
        if (currentUserRole != "Administrator" && currentUserId != id)
        {
            return Forbid();
        }

        var user = await _usersService.GetByIdAsync(id);

        if (user == null)
        {
            return NotFound(new { message = "Usuário não encontrado" });
        }

        // Atualizar campos se fornecidos
        if (!string.IsNullOrEmpty(request.Name))
            user.Name = request.Name;

        if (!string.IsNullOrEmpty(request.Email))
        {
            // Verificar se novo email já existe
            var existingUser = await _usersService.GetByEmailAsync(request.Email);
            if (existingUser != null && existingUser.Id != id)
            {
                return BadRequest(new { message = "Email já cadastrado" });
            }
            user.Email = request.Email;
        }

        if (!string.IsNullOrEmpty(request.Password))
            user.Password = BCrypt.Net.BCrypt.HashPassword(request.Password);

        if (request.Profile.HasValue)
        {
            // Apenas administradores podem alterar o perfil
            if (currentUserRole != "Administrator")
            {
                return Forbid();
            }
            user.Profile = request.Profile.Value;
        }

        user.UpdatedAt = DateTime.UtcNow;

        await _usersService.UpdateAsync(id, user);

        return NoContent();
    }

    // DELETE: api/users/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
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
