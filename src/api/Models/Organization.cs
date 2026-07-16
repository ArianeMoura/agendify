namespace api.Models;

// Raiz do modelo multi-tenant POOLED: cada linha das tabelas de dados aponta
// para uma Organization por tenant_id. Um tenant nunca enxerga dados de outro.
public class Organization
{
    // Organização "default" criada pela primeira migração de tenancy: herda
    // TODOS os registros pré-multi-tenancy (backfill). A migração e o fixture de
    // testes DEVEM usar exatamente este mesmo GUID — se divergirem, o backfill e
    // as FKs deixam de casar. Não é segredo; é um identificador determinístico.
    public const string DefaultOrganizationId = "00000000-0000-0000-0000-000000000001";

    // PK textual (uuid como texto), coerente com o restante do schema.
    public string? Id { get; set; }

    public string Name { get; set; } = null!;

    // Identificador legível e único do tenant (ex.: "condominio-jardins").
    public string Slug { get; set; } = null!;

    // Ciclo de vida do tenant (ex.: "active", "suspended").
    public string Status { get; set; } = "active";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
