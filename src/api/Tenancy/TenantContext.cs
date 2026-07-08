namespace api.Tenancy
{
    // Implementação mutável e scoped do ITenantContext. Começa "vazia" e é preenchida
    // uma vez por request (Fase 2: pelo middleware, a partir do JWT). O Platform Owner
    // ganha bypass do filtro por tenant — daí BypassTenantFilter derivar de IsPlatformOwner.
    public class TenantContext : ITenantContext
    {
        public string? CurrentTenantId { get; private set; }
        public bool IsPlatformOwner { get; private set; }
        public bool BypassTenantFilter => IsPlatformOwner;

        public void SetTenant(string? tenantId, bool isPlatformOwner = false)
        {
            CurrentTenantId = tenantId;
            IsPlatformOwner = isPlatformOwner;
        }
    }
}
