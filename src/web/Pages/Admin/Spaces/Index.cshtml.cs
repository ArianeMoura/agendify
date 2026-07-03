using web.Models;
using web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace web.Pages.Admin.Spaces;

public class IndexModel : PageModel
{
    private readonly ApiClient _apiClient;
    private readonly AuthService _authService;

    public string ApiBaseUrl { get; set; } = string.Empty;

    public List<SpaceDto> Spaces { get; set; } = new();
    public string? Message { get; set; }
    public string? ErrorMessage { get; set; }

    public IndexModel(ApiClient apiClient, AuthService authService, IConfiguration configuration)
    {
        _apiClient = apiClient;
        _authService = authService;
        ApiBaseUrl = configuration["ApiSettings:ApiBaseUrl"] ?? "http://localhost:5089";
    }

    public async Task<IActionResult> OnGetAsync()
    {
        if (!_authService.IsAuthenticated() || !_authService.IsAdmin())
        {
            return RedirectToPage("/Login");
        }

        try
        {
            Spaces = await _apiClient.GetSpacesAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = "Erro ao carregar espaços.";
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
            var success = await _apiClient.DeleteSpaceAsync(id);
            if (success)
            {
                Message = "Espaço excluído com sucesso!";
            }
            else
            {
                ErrorMessage = "Erro ao excluir espaço.";
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = "Erro ao excluir espaço.";
        }

        return RedirectToPage();
    }
}

