using web.Models;
using web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace web.Pages.Admin.Bookings;

public class IndexModel : PageModel
{
    private readonly ApiClient _apiClient;
    private readonly AuthService _authService;

    public List<BookingDto> Bookings { get; set; } = new();
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
            Bookings = await _apiClient.GetBookingsAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = "Erro ao carregar reservas.";
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
            var success = await _apiClient.DeleteBookingAsync(id);
            if (success)
            {
                Message = "Reserva cancelada com sucesso!";
            }
            else
            {
                ErrorMessage = "Erro ao cancelar reserva.";
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = "Erro ao cancelar reserva.";
        }

        return RedirectToPage();
    }
}

