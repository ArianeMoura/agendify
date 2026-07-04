namespace api.Models
{
    // Avaliação de um espaço (RF-013). Traz a funcionalidade para dentro da API,
    // eliminando o envio de PII a um Google Form de terceiros (sem base legal).
    public class Review
    {
        public string? Id { get; set; }
        public string UserId { get; set; } = null!;
        public string SpaceId { get; set; } = null!;
        public int Rating { get; set; }        // 1..5
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
