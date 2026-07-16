using api.Data;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

// DTOs junto do Service para evitar erros de referência/namespace.
public class PeakHourRequest
{
    public int Year { get; set; }        // ex.: 2025
    public int Month { get; set; }       // 1..12
    public string? SpaceId { get; set; }
}

public class PeakHourResult
{
    public string SpaceId { get; set; } = null!;
    public int Hour { get; set; }              // 0..23
    public int ReservationsCount { get; set; }
}

public class AnalyticsService
{
    private readonly AppDbContext _db;

    public AnalyticsService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<PeakHourResult>> GetMonthlyPeakHoursAsync(PeakHourRequest req, CancellationToken ct = default)
    {
        // Intervalo do mês [start, end) em UTC.
        var start = new DateTime(req.Year, req.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = start.AddMonths(1);

        var query = _db.Bookings.AsNoTracking()
            .Where(b => b.StartDateTime >= start && b.StartDateTime < end);

        if (!string.IsNullOrWhiteSpace(req.SpaceId))
            query = query.Where(b => b.SpaceId == req.SpaceId);

        var rows = await query
            .Select(b => new { b.SpaceId, b.StartDateTime })
            .ToListAsync(ct);

        // Agrupamento por (espaço, hora) — dataset mensal é pequeno, feito em memória.
        return rows
            .GroupBy(x => new { x.SpaceId, Hour = x.StartDateTime.Hour })
            .Select(g => new PeakHourResult
            {
                SpaceId = g.Key.SpaceId ?? string.Empty,
                Hour = g.Key.Hour,
                ReservationsCount = g.Count()
            })
            .OrderByDescending(r => r.ReservationsCount)
            .ThenBy(r => r.SpaceId)
            .ThenBy(r => r.Hour)
            .ToList();
    }
}
