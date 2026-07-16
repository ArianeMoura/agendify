using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations;

/// <inheritdoc />
public partial class AddPasswordResetTokens : Migration
{
    // Mesmo predicado do EnableRowLevelSecurity: a linha só aparece com o bypass ligado
    // (cross-tenant / Platform Owner) ou quando o tenant_id casa com a GUC do request.
    private const string Predicate =
        "current_setting('app.bypass_rls', true) = 'on' " +
        "OR tenant_id = current_setting('app.current_tenant', true)";

    // password_reset_tokens é a tabela nova. invitations entra junto porque ficou de fora
    // do EnableRowLevelSecurity: é ITenantScoped e tem o filtro do EF, mas nunca ganhou
    // policy no Postgres — ou seja, hoje está sem a segunda camada de isolamento.
    private static readonly string[] TenantTables =
    {
        "password_reset_tokens", "invitations"
    };

    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "password_reset_tokens",
            columns: table => new
            {
                id = table.Column<string>(type: "text", nullable: false),
                tenant_id = table.Column<string>(type: "text", nullable: false),
                user_id = table.Column<string>(type: "text", nullable: false),
                token_hash = table.Column<string>(type: "text", nullable: false),
                expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                used_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_password_reset_tokens", x => x.id);
                table.ForeignKey(
                    name: "FK_password_reset_tokens_organizations_tenant_id",
                    column: x => x.tenant_id,
                    principalTable: "organizations",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_password_reset_tokens_tenant_id",
            table: "password_reset_tokens",
            column: "tenant_id");

        migrationBuilder.CreateIndex(
            name: "IX_password_reset_tokens_token_hash",
            table: "password_reset_tokens",
            column: "token_hash",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_password_reset_tokens_user_id",
            table: "password_reset_tokens",
            column: "user_id");

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

        migrationBuilder.DropTable(
            name: "password_reset_tokens");
    }
}
