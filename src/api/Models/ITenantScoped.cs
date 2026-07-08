namespace api.Models
{
    // Marca entidades que pertencem a um tenant (organização) via tenant_id. É o
    // gancho ÚNICO que permite, na Fase 2, aplicar o global query filter e o
    // auto-stamp de tenant_id no SaveChanges varrendo o modelo — em vez de repetir
    // a configuração de isolamento em cada entidade (e arriscar esquecer alguma,
    // o que seria um furo de tenancy).
    public interface ITenantScoped
    {
        string TenantId { get; set; }
    }
}
