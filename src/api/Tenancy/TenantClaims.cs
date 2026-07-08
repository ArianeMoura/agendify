namespace api.Tenancy
{
    // Nomes canônicos usados na tenancy, compartilhados entre quem EMITE o token
    // (AuthService) e quem o LÊ (TenantResolutionMiddleware) — evita magic strings.
    public static class TenantClaims
    {
        // Claim que carrega o tenant do usuário dentro do JWT.
        public const string TenantId = "tenant_id";

        // Valor do papel (claim role) que identifica o Platform Owner — a dona da
        // plataforma, que enxerga todos os tenants. O papel só passa a existir de fato
        // na Fase 3 (enum), mas o middleware já o reconhece para ficar forward-compatible.
        public const string PlatformOwnerRole = "PlatformOwner";
    }
}
