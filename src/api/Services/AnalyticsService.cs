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
    // DTOs juntos da Service para evitar erros de referência/namespace
    public class PeakHourRequest
    {
        public int Year { get; set; }   // ex: 2025
        public int Month { get; set; }  // 1..12
        public string? EspacoId { get; set; } // opcional
        public string Status { get; set; } = "Confirmada";
    }

    public class PeakHourResult
    {
        public string EspacoId { get; set; } = null!;
        public string? EspacoNome { get; set; }
        public int Hora { get; set; }              // 0..23
        public int TotalReservas { get; set; }     // contagem
    }

    // Modelo mínimo para projetar a partir da collection Bookings
    // Se você já tem uma classe Reserva em api.Models, podemos usá-la.
    // MAS os nomes abaixo DEVEM refletir exatamente os campos do Mongo.
    public class Reserva
    {
        public ObjectId Id { get; set; }
        public ObjectId UserId { get; set; }
        public ObjectId SpaceId { get; set; }
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Se sua coleção tem Status e EspacoNome, mantenha-os. Se não tiver, remova o uso abaixo.
        public string Status { get; set; } = "Confirmada";
        public string? EspacoNome { get; set; }
    }

    public class AnalyticsService
    {
        private readonly IMongoCollection<Reserva> _reservas;

        public AnalyticsService(IMongoDatabase database, IOptions<DatabaseSettings> databaseSettings)
        {
            _reservas = database.GetCollection<Reserva>(databaseSettings.Value.BookingsCollectionName);
        }

        public async Task<List<PeakHourResult>> GetMonthlyPeakHoursAsync(PeakHourRequest req, CancellationToken ct = default)
        {
            // Intervalo do mês [start, end)
            var start = new DateTime(req.Year, req.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var end = start.AddMonths(1);

            var builder = Builders<Reserva>.Filter;

            // Se sua coleção NÃO tem Status, remova o filtro de Status abaixo.
            var filter = builder.Gte(x => x.StartDateTime, start) &
                         builder.Lt(x => x.StartDateTime, end);

            // Se a sua coleção realmente tiver Status e você quer filtrar:
            // filter &= builder.Eq(x => x.Status, req.Status);

            if (!string.IsNullOrWhiteSpace(req.EspacoId))
            {
                if (ObjectId.TryParse(req.EspacoId, out var espacoObjId))
                    filter &= builder.Eq(x => x.SpaceId, espacoObjId);
                else
                    // fallback para string, caso algum documento guarde como string
                    filter &= builder.Eq("SpaceId", req.EspacoId);
            }

            var results = await _reservas.Aggregate()
                .Match(filter)
                .Project(x => new
                {
                    Hora = x.StartDateTime.Hour,
                    EspacoId = x.SpaceId,
                    x.EspacoNome
                })
                .Group(
                    key => new { key.EspacoId, key.EspacoNome, key.Hora },
                    g => new PeakHourResult
                    {
                        EspacoId = g.Key.EspacoId.ToString(),
                        EspacoNome = g.Key.EspacoNome,
                        Hora = g.Key.Hora,
                        TotalReservas = g.Count()
                    }
                )
                .SortByDescending(r => r.TotalReservas)
                .ThenBy(r => r.EspacoId)
                .ThenBy(r => r.Hora)
                .ToListAsync(ct);

            return results;
        }
    }
}