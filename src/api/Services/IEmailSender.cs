namespace api.Services
{
    // Abstração de envio de e-mail. Hoje só há o convite; a implementação padrão
    // (LoggingEmailSender) apenas registra o link nos logs — sem infra externa. Para
    // envio real (produção), basta trocar por uma implementação (ex.: Resend via HTTPS)
    // no registro do DI, sem tocar em quem consome esta interface.
    public interface IEmailSender
    {
        Task SendInvitationAsync(
            string toEmail, string acceptLink, DateTime expiresAt, CancellationToken ct = default);
    }
}
