using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations;

/// <inheritdoc />
public partial class AddAuthAndLgpd : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "anonymized_at",
            table: "users",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.CreateTable(
            name: "audit_logs",
            columns: table => new
            {
                id = table.Column<string>(type: "text", nullable: false),
                user_id = table.Column<string>(type: "text", nullable: true),
                action = table.Column<string>(type: "text", nullable: false),
                details = table.Column<string>(type: "text", nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_audit_logs", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "consents",
            columns: table => new
            {
                id = table.Column<string>(type: "text", nullable: false),
                user_id = table.Column<string>(type: "text", nullable: false),
                version = table.Column<string>(type: "text", nullable: false),
                accepted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_consents", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "refresh_tokens",
            columns: table => new
            {
                id = table.Column<string>(type: "text", nullable: false),
                user_id = table.Column<string>(type: "text", nullable: false),
                token_hash = table.Column<string>(type: "text", nullable: false),
                expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                revoked_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_refresh_tokens", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "reviews",
            columns: table => new
            {
                id = table.Column<string>(type: "text", nullable: false),
                user_id = table.Column<string>(type: "text", nullable: false),
                space_id = table.Column<string>(type: "text", nullable: false),
                rating = table.Column<int>(type: "integer", nullable: false),
                comment = table.Column<string>(type: "text", nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_reviews", x => x.id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_audit_logs_user_id",
            table: "audit_logs",
            column: "user_id");

        migrationBuilder.CreateIndex(
            name: "IX_consents_user_id",
            table: "consents",
            column: "user_id");

        migrationBuilder.CreateIndex(
            name: "IX_refresh_tokens_token_hash",
            table: "refresh_tokens",
            column: "token_hash",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_refresh_tokens_user_id",
            table: "refresh_tokens",
            column: "user_id");

        migrationBuilder.CreateIndex(
            name: "IX_reviews_space_id",
            table: "reviews",
            column: "space_id");

        migrationBuilder.CreateIndex(
            name: "IX_reviews_user_id",
            table: "reviews",
            column: "user_id");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "audit_logs");

        migrationBuilder.DropTable(
            name: "consents");

        migrationBuilder.DropTable(
            name: "refresh_tokens");

        migrationBuilder.DropTable(
            name: "reviews");

        migrationBuilder.DropColumn(
            name: "anonymized_at",
            table: "users");
    }
}
