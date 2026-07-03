using web.Models;
using web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;

namespace web.Pages.Profile;

public class EditModel : PageModel
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
    public string? Password { get; set; }

    public string? SuccessMessage { get; set; }
    public string? ErrorMessage { get; set; }

    public EditModel(ApiClient apiClient, AuthService authService)
    {
        _apiClient = apiClient;
        _authService = authService;
    }

    public async Task<IActionResult> OnGetAsync()
    {
        if (!_authService.IsAuthenticated())
        {
            return RedirectToPage("/Login");
        }

        try
        {
            var userId = _authService.GetUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return RedirectToPage("/Login");
            }

            var user = await _apiClient.GetUserByIdAsync(userId);
            if (user == null)
            {
                ErrorMessage = "Erro ao carregar dados do usuário.";
                return Page();
            }

            Name = user.Name;
            Email = user.Email;
        }
        catch (Exception ex)
        {
            ErrorMessage = "Erro ao carregar perfil.";
        }

        return Page();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!_authService.IsAuthenticated())
        {
            return RedirectToPage("/Login");
        }

        if (!ModelState.IsValid)
        {
            return Page();
        }

        try
        {
            var userId = _authService.GetUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return RedirectToPage("/Login");
            }

            var request = new UpdateUserRequest
            {
                Name = Name,
                Email = Email,
                Password = string.IsNullOrWhiteSpace(Password) ? null : Password
            };

            var success = await _apiClient.UpdateUserAsync(userId, request);

            if (!success)
            {
                ErrorMessage = "Erro ao atualizar perfil.";
                return Page();
            }

            _authService.SetUser(userId, Name, Email, _authService.GetUserRole() ?? "Common");

            SuccessMessage = "Perfil atualizado com sucesso!";
        }
        catch (Exception ex)
        {
            ErrorMessage = "Erro ao atualizar perfil. Por favor, tente novamente.";
        }

        return Page();
    }
}

