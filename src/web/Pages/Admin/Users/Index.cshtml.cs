using web.Models;
using web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace web.Pages.Admin.Users;

public class IndexModel : PageModel
{
    private readonly ApiClient _apiClient;
    private readonly AuthService _authService;

    public List<UserDto> Users { get; set; } = new();
    public string? Message { get; set; }
    public string? ErrorMessage { get; set; }

    public IndexModel(ApiClient apiClient, AuthService authService)
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
            Users = await _apiClient.GetUsersAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = "Erro ao carregar usuários.";
        }

        return Page();
    }

    public async Task<IActionResult> OnPostDeleteAsync(string id)
    {
        if (!_authService.IsAuthenticated() || !_authService.IsAdmin())
        {
            return RedirectToPage("/Login");
        }

        try
        {
            var success = await _apiClient.DeleteUserAsync(id);
            if (success)
            {
                Message = "Usuário excluído com sucesso!";
            }
            else
            {
                ErrorMessage = "Erro ao excluir usuário.";
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = "Erro ao excluir usuário.";
        }

        return RedirectToPage();
    }
}

