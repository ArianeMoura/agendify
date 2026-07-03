using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Models
{

    public class BookingWithUserAndSpace : Booking
    {
        public User? User { get; set; } = null;
        public Space? Space { get; set; } = null;

    }

    public class Booking
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string? UserId { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string? SpaceId { get; set; }

        public DateTime StartDateTime { get; set; } = DateTime.UtcNow;

        public DateTime EndDateTime { get; set; } = DateTime.UtcNow;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

    }
}