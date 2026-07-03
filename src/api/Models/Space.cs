using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Models
{
    public class SpaceResources
    {
        [BsonRepresentation(BsonType.ObjectId)]
        public string ResourceId { get; set; } = null!;

        public int Quantity { get; set; } = 1;

        public Resource? Resource { get; set; }
    }

    public class Space
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string Name { get; set; } = null!;
        public string? Description { get; set; } = null;
        public int Capacity { get; set; } = 0;
        public string? ImageUrl { get; set; } = null;
        public List<SpaceResources> Resources { get; set; } = new();
        public List<string> AvailableHours { get; set; } = new();
        public bool Availability { get; set; } = true;
        
        public bool IsAllDayBooking { get; set; } = false;
        public string? AllDayStartTime { get; set; } = null;
        public string? AllDayEndTime { get; set; } = null;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
