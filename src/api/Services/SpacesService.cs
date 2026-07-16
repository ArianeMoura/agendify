using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class SpacesService
{
    private readonly AppDbContext _db;
    private readonly ILogger<SpacesService> _logger;

    public SpacesService(AppDbContext db, ILogger<SpacesService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<Space?> GetById(string id)
    {
        var space = await _db.Spaces.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (space is null) return null;

        await EnrichResourcesAsync(new[] { space });
        return space;
    }

    public async Task<List<Space>> GetAsync()
    {
        var spaces = await _db.Spaces.AsNoTracking().ToListAsync();
        await EnrichResourcesAsync(spaces);
        return spaces;
    }

    // Os recursos ficam embutidos em `spaces` (jsonb) só com ResourceId + Quantity.
    // Aqui resolvemos o objeto Resource completo a partir da tabela `resources`,
    // preservando o comportamento anterior de "join" em código.
    private async Task EnrichResourcesAsync(IEnumerable<Space> spaces)
    {
        var resourceIds = spaces
            .SelectMany(s => s.Resources ?? new List<SpaceResources>())
            .Select(r => r.ResourceId)
            .Where(id => !string.IsNullOrEmpty(id))
            .Distinct()
            .ToList();

        if (resourceIds.Count == 0) return;

        var resources = await _db.Resources.AsNoTracking()
            .Where(r => resourceIds.Contains(r.Id!))
            .ToListAsync();

        var resourcesById = resources.ToDictionary(r => r.Id!, r => r);

        foreach (var space in spaces)
        {
            if (space.Resources is null) continue;
            foreach (var sr in space.Resources)
            {
                if (sr is null) continue;
                if (resourcesById.TryGetValue(sr.ResourceId, out var found))
                    sr.Resource = found;
            }
        }
    }

    public async Task Create(Space space)
    {
        _logger.LogInformation("Creating space: {SpaceName}", space.Name);
        if (string.IsNullOrWhiteSpace(space.Id))
            space.Id = Guid.NewGuid().ToString();

        _db.Spaces.Add(space);
        await _db.SaveChangesAsync();
    }

    public async Task Update(string id, Space space)
    {
        space.Id = id;
        _db.Spaces.Update(space);
        await _db.SaveChangesAsync();
    }

    public async Task Delete(string id)
    {
        var space = await _db.Spaces.FirstOrDefaultAsync(x => x.Id == id);
        if (space is null) return;
        _db.Spaces.Remove(space);
        await _db.SaveChangesAsync();
    }
}
