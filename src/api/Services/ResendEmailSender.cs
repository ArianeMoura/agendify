using System.Net.Http.Headers;
using System.Net.Http.Json;
using api.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace api.Services
{
    // Envio real via API HTTP do Resend (https://api.resend.com/emails). Usa HTTPS —
    // contorna as portas SMTP que PaaS (Render/Fly) costumam bloquear. Registrado no DI
    // apenas quando Email:ApiKey está configurado; senão o app usa o LoggingEmailSender.
    public class ResendEmailSender : IEmailSender
    {
        private readonly HttpClient _http;
        private readonly EmailSettings _settings;
        private readonly ILogger<ResendEmailSender> _logger;

        public ResendEmailSender(
            HttpClient http, IOptions<EmailSettings> settings, ILogger<ResendEmailSender> logger)
        {
            _http = http;
            _settings = settings.Value;
            _logger = logger;
        }

        public Task SendInvitationAsync(
            string toEmail, string acceptLink, DateTime expiresAt, CancellationToken ct = default) =>
            SendAsync(toEmail, "Seu convite para o Agendify", BuildHtml(acceptLink, expiresAt), ct);

        public Task SendPasswordResetAsync(
            string toEmail, string resetLink, DateTime expiresAt, CancellationToken ct = default) =>
            SendAsync(toEmail, "Redefinir sua senha do Agendify",
                BuildPasswordResetHtml(resetLink, expiresAt), ct);

        private async Task SendAsync(string toEmail, string subject, string html, CancellationToken ct)
        {
            using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey);
            req.Content = JsonContent.Create(new
            {
                from = $"{_settings.FromName} <{_settings.FromAddress}>",
                to = new[] { toEmail },
                subject,
                html,
            });

            var res = await _http.SendAsync(req, ct);
            if (!res.IsSuccessStatusCode)
            {
                var body = await res.Content.ReadAsStringAsync(ct);
                // Best-effort: quem chama não falha a operação por causa do e-mail; só registramos.
                _logger.LogWarning(
                    "Falha ao enviar e-mail via Resend ({Status}): {Body}", (int)res.StatusCode, body);
            }
        }

        // O acceptLink é um deep link agendify:// (abre no celular). Em desktop, o convidado
        // copia o link e cola na tela de aceite do app. Universal links HTTPS: futuro.
        private static string BuildHtml(string acceptLink, DateTime expiresAt) => $@"
            <p>Você foi convidado para o <strong>Agendify</strong>.</p>
            <p>No celular, toque para aceitar:</p>
            <p><a href=""{acceptLink}"">Aceitar convite</a></p>
            <p>Ou abra o app e cole este link na tela de aceite:</p>
            <p><code>{acceptLink}</code></p>
            <p>O convite expira em {expiresAt:dd/MM/yyyy}.</p>";

        // Diferente do convite, o link do reset é uma URL https do painel (App:BaseUrl): quem
        // esqueceu a senha costuma abrir o e-mail no computador, onde agendify:// não abre nada.
        private static string BuildPasswordResetHtml(string resetLink, DateTime expiresAt) => $@"
            <p>Recebemos um pedido para redefinir a sua senha do <strong>Agendify</strong>.</p>
            <p><a href=""{resetLink}"">Criar uma nova senha</a></p>
            <p>Ou copie e cole este endereço no navegador:</p>
            <p><code>{resetLink}</code></p>
            <p>O link vale até {expiresAt:HH:mm} de {expiresAt:dd/MM/yyyy} e só pode ser usado uma vez.</p>
            <p>Se não foi você quem pediu, ignore este e-mail: a sua senha continua a mesma.</p>";
    }
}
