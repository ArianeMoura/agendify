using api.Models;
using MongoDB.Driver;
using Microsoft.Extensions.Options;
using MongoDB.Bson;

namespace api.Services
{
    public class SpacesService
    {
        private readonly IMongoCollection<Space> _spacesCollection;
        private readonly IMongoCollection<Resource> _resourcesCollection;
        private readonly ILogger<SpacesService> _logger;

        public SpacesService(IMongoDatabase database, IOptions<DatabaseSettings> databaseSettings, ILogger<SpacesService> logger)
        {
            var settings = databaseSettings.Value;
            _spacesCollection = database.GetCollection<Space>(settings.SpacesCollectionName);
            _resourcesCollection = database.GetCollection<Resource>(settings.ResourcesCollectionName);
            _logger = logger;
        }

        public async Task<Space> GetById(string id) {
            var space = await _spacesCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

            var resourceIds = space.Resources
                .Select(r => r.ResourceId)
                .Where(id => id != null)
                .Distinct()
                .ToList();

            if (resourceIds.Count == 0)
            {
                return space;
            }
            
            var resources = await _resourcesCollection.Find(x => resourceIds.Contains(x.Id)).ToListAsync();

            space.Resources = [.. space.Resources.Select(r => {
                r.Resource = resources.FirstOrDefault(x => x.Id == r.ResourceId);
                
                return r;
            })];

            return space;
        }

        public async Task<List<Space>> GetAsync()
        {
            var spaces = await _spacesCollection.Find(FilterDefinition<Space>.Empty).ToListAsync();

            var resourceIds = spaces
                .SelectMany(s => s.Resources ?? Enumerable.Empty<SpaceResources>())
                .Select(r => r.ResourceId)
                .Where(id => id != null)
                .Distinct()
                .ToList();

            if (resourceIds.Count == 0)
            {
                return spaces;
            }

            var resourcesFilter = Builders<Resource>.Filter.In(r => r.Id, resourceIds);
            var resources = await _resourcesCollection.Find(resourcesFilter).ToListAsync();

            var resourcesById = resources.ToDictionary(r => r.Id, r => r);

            foreach (var space in spaces)
            {
                if (space.Resources == null) continue;

                foreach (var sr in space.Resources)
                {
                    if (sr == null) continue;
                    resourcesById.TryGetValue(sr.ResourceId, out var found);
                    sr.Resource = found;
                }
            }

            return spaces;
        }

        public async Task Create(Space space)
        {
            _logger.LogInformation("Creating space: {Space}", space);
            if (string.IsNullOrWhiteSpace(space.Id))
            {
                space.Id = ObjectId.GenerateNewId().ToString();
            }

            await _spacesCollection.InsertOneAsync(space);
        }

        public async Task Update(string id, Space space)
        {
            await _spacesCollection.ReplaceOneAsync(x => x.Id == id, space);
        }

        public async Task Delete(string id)
        {
            await _spacesCollection.DeleteOneAsync(x => x.Id == id);
        }
    }
}