using web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace web.Pages;

public class DashboardModel : PageModel
{
    private readonly AuthService _authService;

    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }

    public DashboardModel(AuthService authService)
    {
        _authService = authService;
    }

    public IActionResult OnGet()
    {
        if (!_authService.IsAuthenticated())
        {
            return RedirectToPage("/Login");
        }

        UserName = _authService.GetUserName() ?? "Usuário";
        UserEmail = _authService.GetUserEmail() ?? "";
        IsAdmin = _authService.IsAdmin();

        return Page();
    }
}

