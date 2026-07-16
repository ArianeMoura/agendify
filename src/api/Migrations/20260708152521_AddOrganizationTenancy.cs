using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations;

/// <inheritdoc />
public partial class AddOrganizationTenancy : Migration
{
    // GUID da organização "default" — DEVE casar com Organization.DefaultOrganizationId.
    // Migrações são auto-contidas, por isso o literal é repetido aqui de propósito.
    private const string DefaultOrgId = "00000000-0000-0000-0000-000000000001";

    // Tabelas de dados que passam a carregar tenant_id (todas as ITenantScoped).
    private static readonly string[] TenantTables =
    {
        "users", "spaces", "bookings", "resources", "reviews",
        "refresh_tokens", "consents", "audit_logs"
    };

    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // 1) Cria a tabela raiz de tenants e semeia a organização "default".
        migrationBuilder.CreateTable(
            name: "organizations",
            columns: table => new
            {
                id = table.Column<string>(type: "text", nullable: false),
                name = table.Column<string>(type: "text", nullable: false),
                slug = table.Column<string>(type: "text", nullable: false),
                status = table.Column<string>(type: "text", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_organizations", x => x.id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_organizations_slug",
            table: "organizations",
            column: "slug",
            unique: true);

        // A org default herda todos os dados pré-multi-tenancy (backfill abaixo).
        migrationBuilder.Sql($@"
                INSERT INTO organizations (id, name, slug, status, created_at)
                VALUES ('{DefaultOrgId}', 'Organização Padrão', 'default', 'active', now());");

        // 2) Padrão expand→backfill→contract por tabela: adiciona tenant_id NULLABLE,
        //    preenche as linhas existentes com a org default, e SÓ ENTÃO trava em
        //    NOT NULL. Fazer NOT NULL de cara quebraria em bases com dados (e a FK
        //    rejeitaria qualquer valor que não fosse uma organização real).
        foreach (var t in TenantTables)
        {
            migrationBuilder.AddColumn<string>(
                name: "tenant_id",
                table: t,
                type: "text",
                nullable: true);

            migrationBuilder.Sql(
                $"UPDATE {t} SET tenant_id = '{DefaultOrgId}' WHERE tenant_id IS NULL;");

            migrationBuilder.AlterColumn<string>(
                name: "tenant_id",
                table: t,
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: $"IX_{t}_tenant_id",
                table: t,
                column: "tenant_id");

            migrationBuilder.AddForeignKey(
                name: $"FK_{t}_organizations_tenant_id",
                table: t,
                column: "tenant_id",
                principalTable: "organizations",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        // A exclusion constraint `no_overlap` do InitialCreate é DELIBERADAMENTE
        // preservada como está — chaveada só por (space_id, during). Incluir
        // tenant_id nela seria REDUNDANTE (space_id já é único globalmente, e cada
        // espaço pertence a um único tenant) e só adicionaria contenção/deadlock ao
        // índice gist sob alta concorrência — arriscando o gate de double-booking,
        // o coração do produto. O RLS da Fase 5 não depende desta constraint.
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // A constraint no_overlap não foi tocada no Up — nada a reverter aqui.
        foreach (var t in TenantTables)
        {
            migrationBuilder.DropForeignKey(
                name: $"FK_{t}_organizations_tenant_id",
                table: t);

            migrationBuilder.DropIndex(
                name: $"IX_{t}_tenant_id",
                table: t);

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: t);
        }

        migrationBuilder.DropTable(name: "organizations");
    }
}
