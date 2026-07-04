using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace api.Services
{
    public class BookingsService
    {
        private readonly AppDbContext _db;

        public BookingsService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<BookingWithUserAndSpace?> GetById(string id)
        {
            var booking = await _db.Bookings.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (booking is null) return null;

            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == booking.UserId);
            var space = await _db.Spaces.AsNoTracking().FirstOrDefaultAsync(x => x.Id == booking.SpaceId);

            return Map(booking, user, space);
        }

        public async Task<List<BookingWithUserAndSpace>> GetByUserId(string userId)
        {
            var bookings = await _db.Bookings.AsNoTracking()
                .Where(x => x.UserId == userId)
                .ToListAsync();

            return await JoinAsync(bookings);
        }

        public async Task<List<BookingWithUserAndSpace>> GetAsync()
        {
            var bookings = await _db.Bookings.AsNoTracking().ToListAsync();
            return await JoinAsync(bookings);
        }

        private async Task<List<BookingWithUserAndSpace>> JoinAsync(List<Booking> bookings)
        {
            var userIds = bookings.Select(b => b.UserId).Where(id => id != null).Distinct().ToList();
            var spaceIds = bookings.Select(b => b.SpaceId).Where(id => id != null).Distinct().ToList();

            var users = await _db.Users.AsNoTracking().Where(x => userIds.Contains(x.Id)).ToListAsync();
            var spaces = await _db.Spaces.AsNoTracking().Where(x => spaceIds.Contains(x.Id)).ToListAsync();

            return bookings.Select(b => Map(
                b,
                users.FirstOrDefault(x => x.Id == b.UserId),
                spaces.FirstOrDefault(x => x.Id == b.SpaceId))).ToList();
        }

        private static BookingWithUserAndSpace Map(Booking b, User? user, Space? space) => new()
        {
            Id = b.Id,
            UserId = b.UserId,
            SpaceId = b.SpaceId,
            StartDateTime = b.StartDateTime,
            EndDateTime = b.EndDateTime,
            Status = b.Status,
            CreatedAt = b.CreatedAt,
            UpdatedAt = b.UpdatedAt,
            User = user,
            Space = space,
        };

        // Validações de regra de negócio com mensagens amigáveis. NÃO cobre
        // sobreposição — essa é garantida atomicamente pela exclusion constraint
        // no banco, evitando o TOCTOU do antigo check-then-insert.
        private async Task ValidateSpaceRulesAsync(Booking booking)
        {
            var space = await _db.Spaces.AsNoTracking().FirstOrDefaultAsync(x => x.Id == booking.SpaceId)
                ?? throw new InvalidOperationException($"O espaço com ID {booking.SpaceId} não foi encontrado.");

            if (!space.Availability)
                throw new InvalidOperationException($"O espaço '{space.Name}' não está disponível para reservas no momento.");

            if (booking.StartDateTime >= booking.EndDateTime)
                throw new InvalidOperationException("A data de início deve ser anterior à data de término.");

            if (space.IsAllDayBooking)
            {
                if (booking.EndDateTime <= DateTime.UtcNow)
                    throw new InvalidOperationException("Não é possível fazer reservas para dias cujo horário de término já passou.");
            }
            else
            {
                if (booking.StartDateTime <= DateTime.UtcNow)
                    throw new InvalidOperationException("Não é possível fazer reservas em horários passados ou no horário atual.");
            }
        }

        public async Task Create(Booking booking)
        {
            if (string.IsNullOrWhiteSpace(booking.Id))
                booking.Id = Guid.NewGuid().ToString();

            await ValidateSpaceRulesAsync(booking);

            _db.Bookings.Add(booking);
            await SaveArbitratingOverlapAsync(booking);
        }

        public async Task Update(string id, Booking booking)
        {
            booking.Id = id;
            // A alteração também passa pela exclusion constraint: editar o horário
            // para um slot ocupado é rejeitado pelo banco (fecha a lacuna do PUT).
            _db.Bookings.Update(booking);
            await SaveArbitratingOverlapAsync(booking);
        }

        public async Task Delete(string id)
        {
            var booking = await _db.Bookings.FirstOrDefaultAsync(x => x.Id == id);
            if (booking is null) return;
            _db.Bookings.Remove(booking);
            await _db.SaveChangesAsync();
        }

        // O banco é o árbitro do invariante RN-01: se duas requisições concorrentes
        // tentam o mesmo slot, exatamente uma persiste; a(s) outra(s) recebem
        // 23P01 (exclusion_violation), aqui traduzido em BookingConflictException.
        private async Task SaveArbitratingOverlapAsync(Booking booking)
        {
            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg
                                               && pg.SqlState == PostgresErrorCodes.ExclusionViolation)
            {
                // Descarta o rastreamento da entidade que falhou para não vazar estado.
                _db.ChangeTracker.Clear();
                throw new BookingConflictException(
                    $"O espaço '{booking.SpaceId}' já está reservado no horário solicitado. " +
                    "Por favor, escolha outro horário.");
            }
        }
    }
}
