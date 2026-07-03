using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace api.Models
{
    [BsonIgnoreExtraElements]
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [Required]
        [BsonElement("name")]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [BsonElement("email")]
        public string Email { get; set; } = string.Empty;

        [Required]
        [BsonElement("password")]
        public string Password { get; set; } = string.Empty;

        [Required]
        [BsonElement("profile")]
        [BsonRepresentation(BsonType.String)]
        public Profile Profile { get; set; }

        [BsonElement("createdAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        [BsonIgnoreIfNull]
        public DateTime? UpdatedAt { get; set; }
    }

    public enum Profile
    {
        Administrator,
        Common
    }
}
