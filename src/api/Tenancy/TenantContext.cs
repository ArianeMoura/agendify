namespace api.Tenancy
{
    // Implementação mutável e scoped do ITenantContext. Começa "vazia" e é preenchida
    // uma vez por request pelo middleware, a partir do JWT. O bypass do filtro/RLS vale
    // para o Platform Owner OU dentro de um escopo cross-tenant (operações pré-tenant).
    public class TenantContext : ITenantContext
    {
        private int _crossTenantDepth;

        public string? CurrentTenantId { get; private set; }
        public bool IsPlatformOwner { get; private set; }

        public bool BypassTenantFilter => IsPlatformOwner || _crossTenantDepth > 0;

        public void SetTenant(string? tenantId, bool isPlatformOwner = false)
        {
            CurrentTenantId = tenantId;
            IsPlatformOwner = isPlatformOwner;
        }

        public IDisposable EnterCrossTenant()
        {
            _crossTenantDepth++;
            return new CrossTenantScope(this);
        }

        private void ExitCrossTenant() => _crossTenantDepth--;

        private sealed class CrossTenantScope : IDisposable
        {
            private readonly TenantContext _ctx;
            private bool _disposed;

            public CrossTenantScope(TenantContext ctx) => _ctx = ctx;

            public void Dispose()
            {
                if (_disposed) return;
                _disposed = true;
                _ctx.ExitCrossTenant();
            }
        }
    }
}
