using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace api.Data
{
    // Usado apenas pelo tooling `dotnet ef` (migrations). Evita executar o
    // Program.cs (fail-fast + Migrate no boot) em tempo de design. A connection
    // string real vem de DatabaseSettings__ConnectionString quando presente.
    public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            var connectionString =
                Environment.GetEnvironmentVariable("DatabaseSettings__ConnectionString")
                ?? "Host=localhost;Port=5432;Database=agendify;Username=agendify;Password=postgres";

            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(connectionString)
                .Options;

            return new AppDbContext(options);
        }
    }
}
