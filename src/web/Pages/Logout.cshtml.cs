using web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace web.Pages;

public class LogoutModel : PageModel
{
    private readonly AuthService _authService;

    public LogoutModel(AuthService authService)
    {
        _authService = authService;
    }

    public IActionResult OnGet()
    {
        _authService.Logout();
        return RedirectToPage("/Login");
    }
}

