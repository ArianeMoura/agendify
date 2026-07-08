using System.Security.Claims;

namespace api.Tenancy
{
    // Resolve o tenant do request e o injeta no ITenantContext (scoped). Deve rodar
    // DEPOIS de UseAuthentication (para HttpContext.User já ter as claims do JWT) e
    // ANTES dos controllers — a partir daqui toda query do AppDbContext é filtrada por
    // este tenant. Requests anônimos ficam sem tenant: o filtro não casa com nada, o
    // que é seguro por padrão (nada vaza).
    public class TenantResolutionMiddleware
    {
        private readonly RequestDelegate _next;

        public TenantResolutionMiddleware(RequestDelegate next) => _next = next;

        // ITenantContext é injetado por método (scoped) — resolvido do escopo do request.
        public async Task InvokeAsync(HttpContext context, ITenantContext tenant)
        {
            var user = context.User;
            if (user?.Identity?.IsAuthenticated == true)
            {
                var tenantId = user.FindFirstValue(TenantClaims.TenantId);
                var isPlatformOwner = user.IsInRole(TenantClaims.PlatformOwnerRole);
                tenant.SetTenant(tenantId, isPlatformOwner);
            }

            await _next(context);
        }
    }
}
