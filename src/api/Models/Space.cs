using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    // Recurso associado a um espaço (com quantidade). Persistido como jsonb
    // dentro de `spaces` (owned collection .ToJson()). `Resource` é enriquecido
    // em runtime a partir da tabela `resources` e NÃO é persistido.
    public class SpaceResources
    {
        public string ResourceId { get; set; } = null!;

        public int Quantity { get; set; } = 1;

        [NotMapped]
        public Resource? Resource { get; set; }
    }

    public class Space
    {
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
