namespace api.Models
{
    // Refresh token rotativo (RNF-001). Guardamos apenas o HASH do token — o valor
    // bruto vive só no cliente. Rotação: ao usar, revoga-se o atual e emite-se outro.
    public class RefreshToken
    {
        public string Id { get; set; } = null!;
        public string UserId { get; set; } = null!;
        public string TokenHash { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RevokedAt { get; set; }

        public bool IsActive => RevokedAt is null && DateTime.UtcNow < ExpiresAt;
    }
}
