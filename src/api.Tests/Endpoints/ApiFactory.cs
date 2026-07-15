using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using api.Tenancy;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.IdentityModel.Tokens;

namespace api.Tests.Endpoints
{
    // Sobe a API in-process para os testes de endpoint. Diferente dos testes de service,
    // aqui o request atravessa o pipeline inteiro — model binding, autenticação JWT e o
    // TenantResolutionMiddleware —, que é a camada onde o 400 do TenantId nascia.
    public class ApiFactory : WebApplicationFactory<Program>
    {
        public const string JwtSecret = "test-secret-com-pelo-menos-32-caracteres!!";
        private const string Issuer = "agendify-api";        // appsettings.json
        private const string Audience = "agendify-api-users";

        // A configuração vai por variável de ambiente, e não por ConfigureAppConfiguration:
        // o Program.cs lê a connection string e o segredo JWT durante os top-level
        // statements, ou seja, antes de qualquer callback do WebApplicationFactory rodar.
        // Só o provider de env vars (já incluso em CreateBuilder) chega a tempo.
        public static void SetEnvironment()
        {
            Environment.SetEnvironmentVariable(
                "DatabaseSettings__ConnectionString", TestDatabaseFixture.ConnectionString);
            Environment.SetEnvironmentVariable("JwtSettings__Secret", JwtSecret);

            // Fora de Development o boot exige a base do painel (link do e-mail de reset).
            Environment.SetEnvironmentVariable("App__BaseUrl", "https://painel.test");

            // "Testing" (≠ "Development") impede o Migrate() do startup de rodar com o papel
            // agendify_app, que não tem CREATE no schema — a fixture já migrou como admin.
            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Testing");
            Environment.SetEnvironmentVariable("ApplyMigrationsOnStartup", "false");
        }

        // Emite um JWT válido de verdade, com as mesmas claims de AuthService.GenerateJwtToken
        // (que é private). Preferido a um AuthenticationHandler de teste: assim a validação do
        // AddJwtBearer e a leitura da claim de tenant ficam dentro do que o teste cobre.
        public static string Token(string userId, string role, string tenantId)
        {
            var handler = new JwtSecurityTokenHandler();
            var descriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId),
                    new Claim(ClaimTypes.Email, $"{userId}@test.local"),
                    new Claim(ClaimTypes.Name, userId),
                    new Claim(ClaimTypes.Role, role),
                    new Claim(TenantClaims.TenantId, tenantId),
                }),
                Expires = DateTime.UtcNow.AddMinutes(15),
                Issuer = Issuer,
                Audience = Audience,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtSecret)),
                    SecurityAlgorithms.HmacSha256Signature),
            };

            return handler.WriteToken(handler.CreateToken(descriptor));
        }
    }
}
