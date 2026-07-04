using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class ResourcesService
    {
        private readonly AppDbContext _db;

        public ResourcesService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Resource?> GetById(string id) =>
            await _db.Resources.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);

        public async Task<List<Resource>> GetAsync() =>
            await _db.Resources.AsNoTracking().ToListAsync();

        public async Task<List<Resource>> GetByIdsAsync(List<string> ids) =>
            await _db.Resources.AsNoTracking().Where(r => ids.Contains(r.Id!)).ToListAsync();

        public async Task Create(Resource resource)
        {
            if (string.IsNullOrWhiteSpace(resource.Id))
                resource.Id = Guid.NewGuid().ToString();

            _db.Resources.Add(resource);
            await _db.SaveChangesAsync();
        }

        public async Task Update(string id, Resource resource)
        {
            resource.Id = id;
            _db.Resources.Update(resource);
            await _db.SaveChangesAsync();
        }

        public async Task Delete(string id)
        {
            var resource = await _db.Resources.FirstOrDefaultAsync(x => x.Id == id);
            if (resource is null) return;
            _db.Resources.Remove(resource);
            await _db.SaveChangesAsync();
        }
    }
}
