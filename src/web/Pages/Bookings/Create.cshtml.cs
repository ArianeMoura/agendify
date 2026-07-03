using web.Models;
using web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;

namespace web.Pages.Bookings;

public class CreateModel : PageModel
{
    private readonly ApiClient _apiClient;
    private readonly AuthService _authService;


    public string ApiBaseUrl { get; set; } = string.Empty;

    [BindProperty]
    [Required(ErrorMessage = "Selecione um espaço")]
    public string SpaceId { get; set; } = string.Empty;

    [BindProperty]
    [Required(ErrorMessage = "Data da reserva é obrigatória")]
    public DateOnly BookingDate { get; set; } = DateOnly.FromDateTime(DateTime.Now);

    [BindProperty]
    public List<string> SelectedTimeSlots { get; set; } = new List<string>();

    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }

    public List<SpaceDto> Spaces { get; set; } = new();
    public string? ErrorMessage { get; set; }

    public CreateModel(ApiClient apiClient, AuthService authService, IConfiguration configuration)
    {
        _apiClient = apiClient;
        _authService = authService;
        ApiBaseUrl = configuration["ApiSettings:ApiBaseUrl"] ?? "http://localhost:5089";
    }

    public async Task<IActionResult> OnGetAsync()
    {
        if (!_authService.IsAuthenticated())
        {
            return RedirectToPage("/Login");
        }

        try
        {
            Spaces = await _apiClient.GetSpacesAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Erro ao carregar espaços: {ex.Message}";
            Console.WriteLine($"Exception loading spaces: {ex}");
        }

        return Page();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!_authService.IsAuthenticated())
        {
            return RedirectToPage("/Login");
        }

        try
        {
            Spaces = await _apiClient.GetSpacesAsync();
        }
        catch { }

        if (!ModelState.IsValid)
        {
            return Page();
        }

        if (BookingDate < DateOnly.FromDateTime(DateTime.Now))
        {
            ErrorMessage = "Não é possível fazer reservas em datas passadas.";
            return Page();
        }

        if (SelectedTimeSlots == null || SelectedTimeSlots.Count == 0)
        {
            ErrorMessage = "Selecione pelo menos um horário.";
            return Page();
        }

        try
        {
            var space = Spaces.FirstOrDefault(s => s.Id == SpaceId);
            if (space == null)
            {
                ErrorMessage = "Espaço não encontrado.";
                return Page();
            }

            var sortedSlots = SelectedTimeSlots.OrderBy(s => s).ToList();
            var firstSlot = sortedSlots.First();
            var lastSlot = sortedSlots.Last();

            if (!TimeSpan.TryParse(firstSlot, out TimeSpan startTime))
            {
                ErrorMessage = "Horário de início inválido.";
                return Page();
            }

            TimeSpan endTime;
            if (space.IsAllDayBooking && !string.IsNullOrWhiteSpace(space.AllDayEndTime))
            {
                if (!TimeSpan.TryParse(space.AllDayEndTime, out endTime))
                {
                    ErrorMessage = "Horário de término inválido.";
                    return Page();
                }
            }
            else
            {
                if (!TimeSpan.TryParse(lastSlot, out TimeSpan lastSlotTime))
                {
                    ErrorMessage = "Horário de fim inválido.";
                    return Page();
                }
                endTime = lastSlotTime.Add(TimeSpan.FromHours(1));
            }

            var startDateTimeLocal = BookingDate.ToDateTime(TimeOnly.FromTimeSpan(startTime));
            var endDateTimeLocal = BookingDate.ToDateTime(TimeOnly.FromTimeSpan(endTime));

            if (space.IsAllDayBooking)
            {
                if (endDateTimeLocal <= DateTime.Now)
                {
                    ErrorMessage = "Não é possível fazer reservas para dias cujo horário de término já passou.";
                    return Page();
                }
            }
            else
            {
                if (startDateTimeLocal <= DateTime.Now)
                {
                    ErrorMessage = "Não é possível fazer reservas em horários passados ou no horário atual.";
                    return Page();
                }
            }

            StartDateTime = DateTime.SpecifyKind(startDateTimeLocal, DateTimeKind.Local).ToUniversalTime();
            EndDateTime = DateTime.SpecifyKind(endDateTimeLocal, DateTimeKind.Local).ToUniversalTime();

            var userId = _authService.GetUserId();
            var request = new CreateBookingRequest
            {
                UserId = userId,
                SpaceId = SpaceId,
                StartDateTime = StartDateTime,
                EndDateTime = EndDateTime
            };

            var response = await _apiClient.CreateBookingAsync(request);

            if (response == null)
            {
                ErrorMessage = "Erro ao criar reserva. O espaço pode não estar disponível no horário selecionado.";
                return Page();
            }

            return RedirectToPage("/Bookings/My");
        }
        catch (Exception ex)
        {
            ErrorMessage = "Erro ao criar reserva. Por favor, tente novamente.";
            return Page();
        }
    }
}

