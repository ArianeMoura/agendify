using web.Models;
using web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;

namespace web.Pages;

public class LoginModel : PageModel
{
    private readonly ApiClient _apiClient;
    private readonly AuthService _authService;

    [BindProperty]
    [Required(ErrorMessage = "Email é obrigatório")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public string Email { get; set; } = string.Empty;

    [BindProperty]
    [Required(ErrorMessage = "Senha é obrigatória")]
    public string Password { get; set; } = string.Empty;

    public string? ErrorMessage { get; set; }

    public LoginModel(ApiClient apiClient, AuthService authService)
    {
        _apiClient = apiClient;
        _authService = authService;
    }

    public IActionResult OnGet()
    {
        if (_authService.IsAuthenticated())
        {
            return RedirectToPage("/Dashboard");
        }

        return Page();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!ModelState.IsValid)
        {
            return Page();
        }

        try
        {
            var request = new LoginRequest
            {
                Email = Email,
                Password = Password
            };

            var response = await _apiClient.LoginAsync(request);

            if (response == null)
            {
                ErrorMessage = "Email ou senha inválidos";
                return Page();
            }

            _authService.SetToken(response.Token);
            _authService.SetUser(
                response.User.Id,
                response.User.Name,
                response.User.Email,
                response.User.Profile.ToString()
            );

            return RedirectToPage("/Dashboard");
        }
        catch (Exception ex)
        {
            ErrorMessage = "Erro ao fazer login. Por favor, tente novamente.";
            return Page();
        }
    }
}

