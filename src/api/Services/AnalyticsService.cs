using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using api.Models;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;

namespace api.Services
{
    // DTOs junto do Service para evitar erros de referência/namespace
    public class PeakHourRequest
    {
        public int Year { get; set; }        // ex.: 2025
        public int Month { get; set; }       // 1..12
        public string? SpaceId { get; set; } // opcional
    }

    public class PeakHourResult
    {
        public string SpaceId { get; set; } = null!;
        public int Hour { get; set; }              // 0..23
        public int ReservationsCount { get; set; } // contagem
    }

    // Projeção mínima sobre a coleção Bookings para as métricas de analytics.
    // Os campos refletem exatamente os do documento no Mongo (ObjectId + datas UTC).
    public class BookingRecord
    {
        public ObjectId Id { get; set; }
        public ObjectId UserId { get; set; }
        public ObjectId SpaceId { get; set; }
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class AnalyticsService
    {
        private readonly IMongoCollection<BookingRecord> _bookings;

        public AnalyticsService(IMongoDatabase database, IOptions<DatabaseSettings> databaseSettings)
        {
            _bookings = database.GetCollection<BookingRecord>(databaseSettings.Value.BookingsCollectionName);
        }

        public async Task<List<PeakHourResult>> GetMonthlyPeakHoursAsync(PeakHourRequest req, CancellationToken ct = default)
        {
            // Intervalo do mês [start, end)
            var start = new DateTime(req.Year, req.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var end = start.AddMonths(1);

            var builder = Builders<BookingRecord>.Filter;

            var filter = builder.Gte(x => x.StartDateTime, start) &
                         builder.Lt(x => x.StartDateTime, end);

            if (!string.IsNullOrWhiteSpace(req.SpaceId))
            {
                if (ObjectId.TryParse(req.SpaceId, out var spaceObjId))
                    filter &= builder.Eq(x => x.SpaceId, spaceObjId);
                else
                    // fallback para string, caso algum documento guarde como string
                    filter &= builder.Eq("SpaceId", req.SpaceId);
            }

            var results = await _bookings.Aggregate()
                .Match(filter)
                .Project(x => new
                {
                    Hour = x.StartDateTime.Hour,
                    SpaceId = x.SpaceId
                })
                .Group(
                    key => new { key.SpaceId, key.Hour },
                    g => new PeakHourResult
                    {
                        SpaceId = g.Key.SpaceId.ToString(),
                        Hour = g.Key.Hour,
                        ReservationsCount = g.Count()
                    }
                )
                .SortByDescending(r => r.ReservationsCount)
                .ThenBy(r => r.SpaceId)
                .ThenBy(r => r.Hour)
                .ToListAsync(ct);

            return results;
        }
    }
}
