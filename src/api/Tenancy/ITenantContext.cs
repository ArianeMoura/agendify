namespace api.Tenancy
{
    // Portador do tenant do request atual. Registrado como Scoped: uma instância por
    // request HTTP (ou por contexto, nos testes). Na Fase 2 será preenchido por um
    // middleware a partir das claims do JWT; já na Fase 1 é usado pelo AppDbContext
    // para CARIMBAR tenant_id em toda escrita (SaveChanges), garantindo que nenhuma
    // linha nasça sem tenant agora que a coluna é NOT NULL.
    public interface ITenantContext
    {
        // Tenant efetivo do request. Null quando ainda não resolvido (ex.: endpoints
        // anônimos, tooling de design-time). Escritas sem tenant não são carimbadas.
        string? CurrentTenantId { get; }

        // True para o Platform Owner (a dona da plataforma), que enxerga todos os tenants.
        bool IsPlatformOwner { get; }

        // Fase 2: quando true, o global query filter é ignorado (Platform Owner vê tudo).
        bool BypassTenantFilter { get; }

        void SetTenant(string? tenantId, bool isPlatformOwner = false);
    }
}
