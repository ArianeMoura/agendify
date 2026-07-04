namespace api.Models
{
    public class Booking
    {
        public string? Id { get; set; }

        public string? UserId { get; set; }

        public string? SpaceId { get; set; }

        public DateTime StartDateTime { get; set; } = DateTime.UtcNow;

        public DateTime EndDateTime { get; set; } = DateTime.UtcNow;

        // Estado da reserva. A exclusion constraint no Postgres só arbitra
        // sobreposição entre reservas 'confirmed'; cancelar libera o slot.
        public string Status { get; set; } = "confirmed";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
