using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations;

/// <inheritdoc />
public partial class EnableRowLevelSecurity : Migration
{
    // Defesa em profundidade (Fase 5): o próprio Postgres recusa linhas de outro
    // tenant, mesmo que a aplicação erre o filtro. Cada tabela tenant-scoped ganha
    // uma policy que só libera a linha quando o bypass está ligado (Platform Owner /
    // operação cross-tenant) OU o tenant_id casa com a GUC app.current_tenant, setada
    // por conexão pelo TenantConnectionInterceptor. FORCE faz o RLS valer também para
    // o dono da tabela (o papel do app no Neon não é superuser).
    private static readonly string[] TenantTables =
    {
        "users", "spaces", "bookings", "resources", "reviews",
        "refresh_tokens", "consents", "audit_logs"
    };

    private const string Predicate =
        "current_setting('app.bypass_rls', true) = 'on' " +
        "OR tenant_id = current_setting('app.current_tenant', true)";

    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        foreach (var t in TenantTables)
        {
            migrationBuilder.Sql($"ALTER TABLE {t} ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql($"ALTER TABLE {t} FORCE ROW LEVEL SECURITY;");
            migrationBuilder.Sql($@"
                    CREATE POLICY tenant_isolation ON {t}
                        USING ({Predicate})
                        WITH CHECK ({Predicate});");
        }
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        foreach (var t in TenantTables)
        {
            migrationBuilder.Sql($"DROP POLICY IF EXISTS tenant_isolation ON {t};");
            migrationBuilder.Sql($"ALTER TABLE {t} NO FORCE ROW LEVEL SECURITY;");
            migrationBuilder.Sql($"ALTER TABLE {t} DISABLE ROW LEVEL SECURITY;");
        }
    }
}
