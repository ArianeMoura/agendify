using web.Models;
using web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;

namespace web.Pages.Admin.Users;

public class EditModel : PageModel
{
    private readonly ApiClient _apiClient;
    private readonly AuthService _authService;

    [BindProperty(SupportsGet = true)]
    public string Id { get; set; } = string.Empty;

    [BindProperty]
    [Required(ErrorMessage = "Nome é obrigatório")]
    public string Name { get; set; } = string.Empty;

    [BindProperty]
    [Required(ErrorMessage = "Email é obrigatório")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public string Email { get; set; } = string.Empty;

    [BindProperty]
    public string? Password { get; set; }

    [BindProperty]
    [Required(ErrorMessage = "Perfil é obrigatório")]
    public Models.Profile Profile { get; set; } = Models.Profile.Common;

    public string? ErrorMessage { get; set; }

    public EditModel(ApiClient apiClient, AuthService authService)
    {
        _apiClient = apiClient;
        _authService = authService;
    }

    public async Task<IActionResult> OnGetAsync()
    {
        if (!_authService.IsAuthenticated() || !_authService.IsAdmin())
        {
            return RedirectToPage("/Login");
        }

        try
        {
            var user = await _apiClient.GetUserByIdAsync(Id);
            if (user == null)
            {
                return RedirectToPage("/Admin/Users/Index");
            }

            Name = user.Name;
            Email = user.Email;
            Profile = user.Profile;
        }
        catch (Exception ex)
        {
            ErrorMessage = "Erro ao carregar usuário.";
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
            var request = new UpdateUserRequest
            {
                Name = Name,
                Email = Email,
                Password = string.IsNullOrWhiteSpace(Password) ? null : Password,
                Profile = Profile
            };

            var success = await _apiClient.UpdateUserAsync(Id, request);

            if (!success)
            {
                ErrorMessage = "Erro ao atualizar usuário.";
                return Page();
            }

            return RedirectToPage("/Admin/Users/Index");
        }
        catch (Exception ex)
        {
            ErrorMessage = "Erro ao atualizar usuário. Por favor, tente novamente.";
            return Page();
        }
    }
}

