using web.Models;
using web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace web.Pages.Bookings;

public class MyModel : PageModel
{
    private readonly ApiClient _apiClient;
    private readonly AuthService _authService;

    public List<BookingDto> Bookings { get; set; } = new();
    public string? Message { get; set; }
    public string? ErrorMessage { get; set; }

    public MyModel(ApiClient apiClient, AuthService authService)
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
            if (!string.IsNullOrEmpty(userId))
            {
                Bookings = await _apiClient.GetBookingsByUserIdAsync(userId);
            }
            else
            {
                ErrorMessage = "Usuário não identificado.";
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Erro ao carregar suas reservas: {ex.Message}";
            Console.WriteLine($"Exception loading bookings: {ex}");
        }

        return Page();
    }

    public async Task<IActionResult> OnPostCancelAsync(string id)
    {
        if (!_authService.IsAuthenticated())
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

