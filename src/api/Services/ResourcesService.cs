using api.Models;
using MongoDB.Driver;
using Microsoft.Extensions.Options;
using MongoDB.Bson;

namespace api.Services
{
    public class ResourcesService
    {
        private readonly IMongoCollection<Resource> _resourcesCollection;

        public ResourcesService(IMongoDatabase database, IOptions<DatabaseSettings> databaseSettings)
        {
            _resourcesCollection = database.GetCollection<Resource>(databaseSettings.Value.ResourcesCollectionName);
        }

        public async Task<Resource> GetById(string id) => await _resourcesCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task<List<Resource>> GetAsync() => await _resourcesCollection.Find(_ => true).ToListAsync();

        public async Task<List<Resource>> GetByIdsAsync(List<string> ids) =>
            await _resourcesCollection.Find(resource => ids.Contains(resource.Id)).ToListAsync();

        public async Task Create(Resource resource)
        {
            if (string.IsNullOrWhiteSpace(resource.Id))
            {
                resource.Id = ObjectId.GenerateNewId().ToString();
            }
            await _resourcesCollection.InsertOneAsync(resource);
        }

        public async Task Update(string id, Resource resource)
        {
            await _resourcesCollection.ReplaceOneAsync(x => x.Id == id, resource);
        }

        public async Task Delete(string id)
        {
            await _resourcesCollection.DeleteOneAsync(x => x.Id == id);
        }
    }
}