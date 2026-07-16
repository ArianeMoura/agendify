using Microsoft.Extensions.Logging;

namespace api.Services;

// Implementação enxuta para testes: em vez de enviar e-mail de verdade, registra o
// convite (destinatário + link de aceite) nos logs do servidor. Zero dependência
// externa, zero segredo, zero porta SMTP. Trocar por um sender real (Resend) quando
// o produto for para produção.
public class LoggingEmailSender : IEmailSender
{
    private readonly ILogger<LoggingEmailSender> _logger;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendInvitationAsync(
        string toEmail, string acceptLink, DateTime expiresAt, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "[CONVITE] Para: {ToEmail} | Link de aceite: {AcceptLink} | Expira: {ExpiresAt:u}",
            toEmail, acceptLink, expiresAt);
        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(
        string toEmail, string resetLink, DateTime expiresAt, CancellationToken ct = default)
    {
        // Em dev é assim que se pega o link: ele não sai por e-mail nenhum.
        _logger.LogInformation(
            "[RESET DE SENHA] Para: {ToEmail} | Link: {ResetLink} | Expira: {ExpiresAt:u}",
            toEmail, resetLink, expiresAt);
        return Task.CompletedTask;
    }
}
