using web.Models;
using web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;

namespace web.Pages.Admin.Users;

public class CreateModel : PageModel
{
    private readonly ApiClient _apiClient;
    private readonly AuthService _authService;

    [BindProperty]
    [Required(ErrorMessage = "Nome é obrigatório")]
    public string Name { get; set; } = string.Empty;

    [BindProperty]
    [Required(ErrorMessage = "Email é obrigatório")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public string Email { get; set; } = string.Empty;

    [BindProperty]
    [Required(ErrorMessage = "Senha é obrigatória")]
    [MinLength(6, ErrorMessage = "Senha deve ter no mínimo 6 caracteres")]
    public string Password { get; set; } = string.Empty;

    [BindProperty]
    [Required(ErrorMessage = "Perfil é obrigatório")]
    public Models.Profile Profile { get; set; } = Models.Profile.Common;

    public string? ErrorMessage { get; set; }

    public CreateModel(ApiClient apiClient, AuthService authService)
    {
        _apiClient = apiClient;
        _authService = authService;
    }

    public IActionResult OnGet()
    {
        if (!_authService.IsAuthenticated() || !_authService.IsAdmin())
        {
            return RedirectToPage("/Login");
        }

        return Page();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!_authService.IsAuthenticated() || !_authService.IsAdmin())
        {
            return RedirectToPage("/Login");
        }

        if (!ModelState.IsValid)
        {
            return Page();
        }

        try
        {
            var request = new CreateUserRequest
            {
                Name = Name,
                Email = Email,
                Password = Password,
                Profile = Profile
            };

            var response = await _apiClient.CreateUserAsync(request);

            if (response == null)
            {
                ErrorMessage = "Erro ao criar usuário. Email pode já estar cadastrado.";
                return Page();
            }

            return RedirectToPage("/Admin/Users/Index");
        }
        catch (Exception ex)
        {
            ErrorMessage = "Erro ao criar usuário. Por favor, tente novamente.";
            return Page();
        }
    }
}

