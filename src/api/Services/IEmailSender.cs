namespace api.Services
{
    // Abstração de envio de e-mail. A implementação padrão (LoggingEmailSender) apenas
    // registra o link nos logs — sem infra externa, o que mantém dev/testes/CI rodando sem
    // segredo. Com Email:ApiKey configurado, o DI troca pelo ResendEmailSender (HTTPS).
    public interface IEmailSender
    {
        Task SendInvitationAsync(
            string toEmail, string acceptLink, DateTime expiresAt, CancellationToken ct = default);

        Task SendPasswordResetAsync(
            string toEmail, string resetLink, DateTime expiresAt, CancellationToken ct = default);
    }
}
