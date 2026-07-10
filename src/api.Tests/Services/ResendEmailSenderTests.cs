using System.Net;
using api.Models;
using api.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NUnit.Framework;

namespace api.Tests.Services
{
    // Testa o contrato do ResendEmailSender SEM rede: um handler mockado captura o request
    // e verificamos URL, header de auth e destinatário/link no corpo.
    [TestFixture]
    public class ResendEmailSenderTests
    {
        private sealed class CapturingHandler : HttpMessageHandler
        {
            public HttpRequestMessage? Request { get; private set; }
            public string? Body { get; private set; }

            protected override async Task<HttpResponseMessage> SendAsync(
                HttpRequestMessage request, CancellationToken ct)
            {
                Request = request;
                Body = request.Content is null ? null : await request.Content.ReadAsStringAsync(ct);
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("{\"id\":\"test\"}"),
                };
            }
        }

        [Test]
        public async Task SendInvitation_PostsToResend_WithAuthAndRecipient()
        {
            var handler = new CapturingHandler();
            var http = new HttpClient(handler);
            var settings = Options.Create(new EmailSettings
            {
                ApiKey = "re_test_key",
                FromAddress = "no-reply@example.com",
                FromName = "Agendify",
            });
            var sender = new ResendEmailSender(http, settings, NullLogger<ResendEmailSender>.Instance);

            await sender.SendInvitationAsync(
                "guest@example.com", "agendify://accept-invite?token=ABC", DateTime.UtcNow.AddDays(7));

            Assert.That(handler.Request!.Method, Is.EqualTo(HttpMethod.Post));
            Assert.That(handler.Request.RequestUri!.ToString(), Is.EqualTo("https://api.resend.com/emails"));
            Assert.That(handler.Request.Headers.Authorization!.ToString(), Is.EqualTo("Bearer re_test_key"));
            Assert.That(handler.Body, Does.Contain("guest@example.com"));
            Assert.That(handler.Body, Does.Contain("agendify://accept-invite?token=ABC"));
        }
    }
}
