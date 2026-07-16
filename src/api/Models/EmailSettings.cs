namespace api.Models;

// Config do envio de e-mail (Resend). O segredo (ApiKey) vem de User Secrets (dev) ou
// da env Email__ApiKey (prod) — NUNCA versionado. Sem ApiKey, o app cai no
// LoggingEmailSender (registra o link nos logs), então dev/testes/CI rodam sem infra.
public class EmailSettings
{
    public string? ApiKey { get; set; }

    // Remetente. Precisa ser verificado no Resend; para enviar a e-mails ARBITRÁRIOS
    // é necessário verificar um domínio (ex.: no-reply@seudominio.com).
    public string FromAddress { get; set; } = string.Empty;

    public string FromName { get; set; } = "Agendify";
}
