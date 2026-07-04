namespace api.Models
{
    public class Resource
    {
        public string? Id { get; set; }

        public string Name { get; set; } = null!;

        public string? Description { get; set; } = null;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
