using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using api.Services;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [ApiController]
    [Route("api/analytics")]
    public class AnalyticsController : ControllerBase
    {
        private readonly AnalyticsService _analyticsService;

        public AnalyticsController(AnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        // GET /api/analytics/peak-hours?year=2025&month=9&spaceId=OPCIONAL
        [HttpGet("peak-hours")]
        public async Task<ActionResult<List<PeakHourResult>>> GetPeakHours(
            [FromQuery] int year,
            [FromQuery] int month,
            [FromQuery] string? spaceId,
            CancellationToken ct)
        {
            if (year <= 0 || month < 1 || month > 12)
                return BadRequest("Parâmetros inválidos: informe 'year' e 'month' válidos.");

            var req = new PeakHourRequest
            {
                Year = year,
                Month = month,
                SpaceId = spaceId
            };

            var data = await _analyticsService.GetMonthlyPeakHoursAsync(req, ct);
            return Ok(data);
        }
    }
}