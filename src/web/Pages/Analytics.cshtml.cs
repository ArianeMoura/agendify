using Microsoft.AspNetCore.Mvc.RazorPages;
using System;

namespace Web.Pages // ajuste este namespace conforme seu projeto (ex.: Agendify.Web.Pages)
{
    public class AnalyticsModel : PageModel
    {
        private readonly IConfiguration _configuration;

        public AnalyticsModel(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public int Year { get; set; } = DateTime.Now.Year;
        public int Month { get; set; } = DateTime.Now.Month;
        public string? EspacoId { get; set; }
        public string ApiBaseUrl { get; set; } = string.Empty;

        public void OnGet()
        {
            // Lê a URL base da API das configurações
            ApiBaseUrl = _configuration["ApiSettings:ApiBaseUrl"] ?? "http://localhost:5089";

            // Se quiser, ler querystring:
            // if (int.TryParse(Request.Query["year"], out var y)) Year = y;
            // if (int.TryParse(Request.Query["month"], out var m)) Month = m;
            // EspacoId = Request.Query["espacoId"].ToString();
        }
    }
}