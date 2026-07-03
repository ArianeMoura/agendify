using web.Models;
using web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;

namespace web.Pages.Admin.Spaces;

public class CreateModel : PageModel
{
    private readonly ApiClient _apiClient;
    private readonly AuthService _authService;

    [BindProperty]
    [Required(ErrorMessage = "Nome é obrigatório")]
    public string Name { get; set; } = string.Empty;

    [BindProperty]
    public string? Description { get; set; }

    [BindProperty]
    [Required(ErrorMessage = "Capacidade é obrigatória")]
    [Range(1, 1000, ErrorMessage = "Capacidade deve ser entre 1 e 1000")]
    public int Capacity { get; set; } = 1;

    [BindProperty]
    public List<string> SelectedHours { get; set; } = new List<string>();

    [BindProperty]
    public bool Availability { get; set; } = true;

    [BindProperty]
    public bool IsAllDayBooking { get; set; } = false;

    [BindProperty]
    public string? AllDayStartTime { get; set; }

    [BindProperty]
    public string? AllDayEndTime { get; set; }

    public List<string> AllAvailableHours { get; set; } = new List<string>
    {
        "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
        "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
    };

    [BindProperty]
    public IFormFile? Image { get; set; }

    public string? ErrorMessage { get; set; }

    public CreateModel(ApiClient apiClient, AuthService authService)
    {
        _apiClient = apiClient;
        _authService = authService;
    }

    public IActionResult OnGet()
    {
        if (!_authService.IsAuthenticated() || !_authService.IsAdmin())
        {
            return RedirectToPage("/Login");
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

        if (IsAllDayBooking)
        {
            if (string.IsNullOrWhiteSpace(AllDayStartTime) || string.IsNullOrWhiteSpace(AllDayEndTime))
            {
                ErrorMessage = "Para reservas de dia inteiro, é necessário informar o horário de início e término.";
                return Page();
            }
        }

        try
        {
            var space = new SpaceDto
            {
                Name = Name,
                Description = Description,
                Capacity = Capacity,
                AvailableHours = SelectedHours ?? new List<string>(),
                Availability = Availability,
                IsAllDayBooking = IsAllDayBooking,
                AllDayStartTime = AllDayStartTime,
                AllDayEndTime = AllDayEndTime,
                Resources = new List<SpaceResourceDto>()
            };

            var response = await _apiClient.CreateSpaceAsync(space, Image);

            if (response == null)
            {
                ErrorMessage = "Erro ao criar espaço.";
                return Page();
            }

            return RedirectToPage("/Admin/Spaces/Index");
        }
        catch (Exception ex)
        {
            ErrorMessage = "Erro ao criar espaço. Por favor, tente novamente.";
            return Page();
        }
    }
}

