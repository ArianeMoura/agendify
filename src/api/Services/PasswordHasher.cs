namespace api.Services
{
    // Ponto único de hash de senha. Antes cada chamador usava BCrypt.HashPassword direto, com
    // o work factor default (10) — enquanto o SECURITY.md exige ≥ 12. Centralizar evita que os
    // dois voltem a divergir.
    public static class PasswordHasher
    {
        // O custo vai gravado no próprio hash, então senhas criadas com o fator antigo
        // continuam validando normalmente; só as novas usam 12.
        private const int WorkFactor = 12;

        public static string Hash(string password) =>
            BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

        public static bool Verify(string password, string hash) =>
            BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
