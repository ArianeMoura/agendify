namespace api.Tenancy
{
    // Portador do tenant do request atual. Registrado como Scoped: uma instância por
    // request HTTP (ou por contexto, nos testes). Preenchido pelo TenantResolutionMiddleware
    // a partir das claims do JWT. Usado pelo AppDbContext para carimbar tenant_id nas
    // escritas e no global query filter, e pelo TenantConnectionInterceptor para setar as
    // GUCs de RLS no Postgres.
    public interface ITenantContext
    {
        // Tenant efetivo do request. Null quando ainda não resolvido (ex.: endpoints
        // anônimos, tooling de design-time). Escritas sem tenant não são carimbadas.
        string? CurrentTenantId { get; }

        // True para o Platform Owner (a dona da plataforma), que enxerga todos os tenants.
        bool IsPlatformOwner { get; }

        // Quando true, o global query filter (EF) e o RLS (Postgres) são ignorados — o
        // contexto enxerga/escreve em todos os tenants. Vale para o Platform Owner e para
        // operações de sistema "pré-tenant" (dentro de um EnterCrossTenant).
        bool BypassTenantFilter { get; }

        void SetTenant(string? tenantId, bool isPlatformOwner = false);

        // Abre um escopo cross-tenant (bypass do filtro EF + do RLS) para operações que
        // legitimamente cruzam tenants antes de o tenant estar resolvido: login por
        // e-mail, refresh/logout por hash, self-signup de organização e aceite de convite.
        // Uso: `using (_tenant.EnterCrossTenant()) { ... }`. Reentrante (contador de nível).
        IDisposable EnterCrossTenant();
    }
}
