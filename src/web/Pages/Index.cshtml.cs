using web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace web.Pages;

public class IndexModel : PageModel
{
    private readonly AuthService _authService;

    public IndexModel(AuthService authService)
    {
        _authService = authService;
    }

    public IActionResult OnGet()
    {
        if (_authService.IsAuthenticated())
        {
            return RedirectToPage("/Dashboard");
        }

        return RedirectToPage("/Login");
    }
}
