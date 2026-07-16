using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations;

/// <inheritdoc />
public partial class RenameProfileToRole : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Renomeia a coluna preservando os dados (não é drop/add).
        migrationBuilder.RenameColumn(
            name: "profile",
            table: "users",
            newName: "role");

        // Remapeia os valores do enum para os novos papéis (guardados como texto).
        // Administrator -> OrgAdmin (admin do tenant); Common -> Member (usuário final).
        // O PlatformOwner é criado à parte (passo manual documentado), não há origem aqui.
        migrationBuilder.Sql("UPDATE users SET role = 'OrgAdmin' WHERE role = 'Administrator';");
        migrationBuilder.Sql("UPDATE users SET role = 'Member' WHERE role = 'Common';");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Reverte os valores antes de renomear a coluna de volta. PlatformOwner
        // não tem equivalente antigo — rebaixa para Administrator no downgrade.
        migrationBuilder.Sql("UPDATE users SET role = 'Administrator' WHERE role IN ('OrgAdmin', 'PlatformOwner');");
        migrationBuilder.Sql("UPDATE users SET role = 'Common' WHERE role = 'Member';");

        migrationBuilder.RenameColumn(
            name: "role",
            table: "users",
            newName: "profile");
    }
}
