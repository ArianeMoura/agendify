using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace api.Services;

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
        User = user is null ? null : new UserDto
        {
            Id = user.Id!,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            CreatedAt = user.CreatedAt,
        },
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

    // Nº máximo de tentativas ao salvar sob contenção. Cada deadlock transitório
    // reduz a concorrência (o vencedor commita e sai), então poucas retentativas
    // convergem — mantemos folga para o gate de 100 requisições simultâneas.
    private const int MaxSaveAttempts = 10;

    // O banco é o árbitro do invariante RN-01. Sob concorrência, salvar uma reserva
    // termina de três formas:
    //  1) sucesso — persistiu;
    //  2) 23P01 (exclusion_violation) — conflito DEFINITIVO de sobreposição → 409;
    //  3) 40P01/40001 (deadlock/serialization) — falha TRANSITÓRIA de contenção.
    //     Multi-tenancy introduziu uma FK bookings.tenant_id → organizations; sob
    //     100 inserts simultâneos, checar a FK + a exclusion constraint envolve dois
    //     recursos de lock e o Postgres pode abortar uma transação por deadlock em
    //     vez de exclusion_violation. NÃO é conflito: reprocessamos (a doc do Postgres
    //     recomenda repetir em 40P01/40001). Na retentativa o vencedor já commitou,
    //     então esta tentativa recebe um 23P01 limpo (→ 409) ou persiste se o slot
    //     vagou. Exatamente uma das concorrentes ainda persiste.
    private async Task SaveArbitratingOverlapAsync(Booking booking)
    {
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                await _db.SaveChangesAsync();
                return;
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
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg
                                               && (pg.SqlState == PostgresErrorCodes.DeadlockDetected
                                                   || pg.SqlState == PostgresErrorCodes.SerializationFailure)
                                               && attempt < MaxSaveAttempts)
            {
                // A entidade segue rastreada como Added/Modified; espera um instante
                // (backoff com jitter para dispersar as concorrentes) e tenta de novo.
                await Task.Delay(TimeSpan.FromMilliseconds(Random.Shared.Next(10, 40) * attempt));
            }
        }
    }
}
