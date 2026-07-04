using System.ComponentModel.DataAnnotations;

namespace api.Models
{
    public class User
    {
        // PK textual (uuid armazenado como texto) — mantém o contrato de Id string
        // consumido por controllers, DTOs e claims do JWT sem churn.
        public string? Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        [Required]
        public Profile Profile { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Marca contas anonimizadas via direito de apagamento (LGPD). A linha vira
        // tombstone (PII sobrescrita) mas preserva o vínculo agregado das reservas.
        public DateTime? AnonymizedAt { get; set; }
    }

    public enum Profile
    {
        Administrator,
        Common
    }
}
