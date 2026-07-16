using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations;

/// <inheritdoc />
public partial class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Necessária para a exclusion constraint indexar `space_id` (text) com `=`
        // via GiST, ao lado do range `during` com `&&`.
        migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS btree_gist;");

        migrationBuilder.CreateTable(
            name: "bookings",
            columns: table => new
            {
                id = table.Column<string>(type: "text", nullable: false),
                user_id = table.Column<string>(type: "text", nullable: true),
                space_id = table.Column<string>(type: "text", nullable: true),
                start_date_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                end_date_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                status = table.Column<string>(type: "text", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_bookings", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "idempotency_keys",
            columns: table => new
            {
                key = table.Column<string>(type: "text", nullable: false),
                user_id = table.Column<string>(type: "text", nullable: false),
                response_status = table.Column<int>(type: "integer", nullable: false),
                response_body = table.Column<string>(type: "text", nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_idempotency_keys", x => new { x.key, x.user_id });
            });

        migrationBuilder.CreateTable(
            name: "resources",
            columns: table => new
            {
                id = table.Column<string>(type: "text", nullable: false),
                name = table.Column<string>(type: "text", nullable: false),
                description = table.Column<string>(type: "text", nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_resources", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "spaces",
            columns: table => new
            {
                id = table.Column<string>(type: "text", nullable: false),
                name = table.Column<string>(type: "text", nullable: false),
                description = table.Column<string>(type: "text", nullable: true),
                capacity = table.Column<int>(type: "integer", nullable: false),
                image_url = table.Column<string>(type: "text", nullable: true),
                available_hours = table.Column<List<string>>(type: "text[]", nullable: false),
                availability = table.Column<bool>(type: "boolean", nullable: false),
                is_all_day_booking = table.Column<bool>(type: "boolean", nullable: false),
                all_day_start_time = table.Column<string>(type: "text", nullable: true),
                all_day_end_time = table.Column<string>(type: "text", nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                resources = table.Column<string>(type: "jsonb", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_spaces", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "users",
            columns: table => new
            {
                id = table.Column<string>(type: "text", nullable: false),
                name = table.Column<string>(type: "text", nullable: false),
                email = table.Column<string>(type: "text", nullable: false),
                password = table.Column<string>(type: "text", nullable: false),
                profile = table.Column<string>(type: "text", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_users", x => x.id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_bookings_space_id",
            table: "bookings",
            column: "space_id");

        migrationBuilder.CreateIndex(
            name: "IX_bookings_user_id",
            table: "bookings",
            column: "user_id");

        migrationBuilder.CreateIndex(
            name: "IX_users_email",
            table: "users",
            column: "email",
            unique: true);

        // Coração da RN-01. `during` é um range [início, fim) DERIVADO das colunas
        // de tempo (coluna gerada STORED) — a aplicação nunca o escreve. A exclusion
        // constraint faz o Postgres rejeitar, atomicamente, qualquer segunda reserva
        // 'confirmed' que se sobreponha no mesmo espaço. Adjacência ([)) é permitida.
        // Sob N requisições concorrentes ao mesmo slot, exatamente uma persiste;
        // as demais recebem SQLSTATE 23P01 (exclusion_violation).
        migrationBuilder.Sql(@"
                ALTER TABLE bookings
                    ADD COLUMN during tstzrange
                    GENERATED ALWAYS AS (tstzrange(start_date_time, end_date_time, '[)')) STORED;");

        migrationBuilder.Sql(@"
                ALTER TABLE bookings
                    ADD CONSTRAINT no_overlap
                    EXCLUDE USING gist (space_id WITH =, during WITH &&)
                    WHERE (status = 'confirmed');");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "bookings");

        migrationBuilder.DropTable(
            name: "idempotency_keys");

        migrationBuilder.DropTable(
            name: "resources");

        migrationBuilder.DropTable(
            name: "spaces");

        migrationBuilder.DropTable(
            name: "users");
    }
}
