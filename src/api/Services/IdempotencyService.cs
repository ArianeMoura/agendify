using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

// Idempotência de operações de escrita (RNF-014). Uma retentativa com o mesmo
// (Idempotency-Key, usuário) devolve a resposta original — retries de rede não
// criam reservas duplicadas.
public class IdempotencyService
{
    private readonly AppDbContext _db;

    public IdempotencyService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IdempotencyKey?> GetAsync(string key, string userId) =>
        await _db.IdempotencyKeys.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Key == key && x.UserId == userId);

    public async Task SaveAsync(string key, string userId, int status, string? body)
    {
        _db.IdempotencyKeys.Add(new IdempotencyKey
        {
            Key = key,
            UserId = userId,
            ResponseStatus = status,
            ResponseBody = body,
        });

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Corrida com outra retentativa que gravou primeiro: a chave já
            // existe (PK composta). O resultado é o mesmo, então ignoramos.
            _db.ChangeTracker.Clear();
        }
    }
}
