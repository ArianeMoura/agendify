namespace api.Models
{
    // Consentimento versionado (LGPD). Cada aceite registra a versão do termo e o
    // momento — permite provar qual política o titular aceitou e quando.
    public class Consent
    {
        public string Id { get; set; } = null!;
        public string UserId { get; set; } = null!;
        public string Version { get; set; } = null!;
        public DateTime AcceptedAt { get; set; } = DateTime.UtcNow;
    }
}
