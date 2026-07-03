using web.Models;
using web.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;

namespace web.Pages.Admin.Spaces;

public class EditModel : PageModel
{
    private readonly ApiClient _apiClient;
    private readonly AuthService _authService;

    public string ApiBaseUrl { get; set; } = string.Empty;

    [BindProperty(SupportsGet = true)]
    public string Id { get; set; } = string.Empty;

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

    public string? CurrentImageUrl { get; set; }

    public string? ErrorMessage { get; set; }

    public EditModel(ApiClient apiClient, AuthService authService, IConfiguration configuration)
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
            var space = await _apiClient.GetSpaceByIdAsync(Id);
            if (space == null)
            {
                return RedirectToPage("/Admin/Spaces/Index");
            }

            Name = space.Name;
            Description = space.Description;
            Capacity = space.Capacity;
            SelectedHours = space.AvailableHours?.ToList() ?? new List<string>();
            Availability = space.Availability;
            IsAllDayBooking = space.IsAllDayBooking;
            AllDayStartTime = space.AllDayStartTime;
            AllDayEndTime = space.AllDayEndTime;
            CurrentImageUrl = space.ImageUrl;
        }
        catch (Exception ex)
        {
            ErrorMessage = "Erro ao carregar espaço.";
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
                Id = Id,
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

            var success = await _apiClient.UpdateSpaceAsync(space, Image);

            if (!success)
            {
                ErrorMessage = "Erro ao atualizar espaço.";
                var reloadedSpace = await _apiClient.GetSpaceByIdAsync(Id);
                if (reloadedSpace != null)
                {
                    SelectedHours = reloadedSpace.AvailableHours?.ToList() ?? new List<string>();
                    CurrentImageUrl = reloadedSpace.ImageUrl;
                }
                return Page();
            }

            return RedirectToPage("/Admin/Spaces/Index");
        }
        catch (Exception ex)
        {
            ErrorMessage = "Erro ao atualizar espaço. Por favor, tente novamente.";
            return Page();
        }
    }
}

