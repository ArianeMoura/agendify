using api.Data;
using api.Models;
using api.Services;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace api.Tests.Services
{
    // Onboarding (Fase 4): self-signup de organização e convites. Os serviços rodam
    // como nos endpoints reais: signup e aceite com contexto anônimo (tenantId null),
    // criação de convite com o contexto do tenant do OrgAdmin.
    [TestFixture]
    public class OnboardingTests
    {
        [SetUp]
        public async Task SetUp() => await TestDatabaseFixture.ResetAsync();

        private static OrganizationsService OrgSvc(AppDbContext db) => new(db);
        private static InvitationsService InviteSvc(AppDbContext db, IEmailSender? sender = null) =>
            new(db, sender ?? new RecordingEmailSender());

        // Sender de teste: em vez de enviar, guarda o último convite "entregue".
        private sealed class RecordingEmailSender : IEmailSender
        {
            public string? LastToEmail { get; private set; }
            public string? LastAcceptLink { get; private set; }

            public Task SendInvitationAsync(
                string toEmail, string acceptLink, DateTime expiresAt, CancellationToken ct = default)
            {
                LastToEmail = toEmail;
                LastAcceptLink = acceptLink;
                return Task.CompletedTask;
            }

            // Fora do escopo destes testes; ver PasswordResetServiceTests.
            public Task SendPasswordResetAsync(
                string toEmail, string resetLink, DateTime expiresAt, CancellationToken ct = default) =>
                Task.CompletedTask;
        }

        private static CreateOrganizationRequest Signup(string org, string email) => new()
        {
            OrganizationName = org,
            AdminName = "Admin",
            AdminEmail = email,
            AdminPassword = "secret123",
        };

        [Test]
        public async Task SignUp_CreatesOrganizationAndOrgAdmin()
        {
            OrganizationCreatedResponse res;
            await using (var db = TestDatabaseFixture.CreateContext(tenantId: null))
                res = await OrgSvc(db).SignUpAsync(Signup("Condomínio Jardins", "ana@jardins.dev"));

            Assert.That(res.Slug, Does.Contain("jardins"));

            await using var check = TestDatabaseFixture.CreateContext(res.OrganizationId);
            var admin = await check.Users.SingleAsync();
            Assert.That(admin.Role, Is.EqualTo(Role.OrgAdmin));
            Assert.That(admin.TenantId, Is.EqualTo(res.OrganizationId));
            Assert.That(admin.Email, Is.EqualTo("ana@jardins.dev"));
        }

        [Test]
        public async Task SignUp_RejectsDuplicateEmail()
        {
            await using (var db = TestDatabaseFixture.CreateContext(tenantId: null))
                await OrgSvc(db).SignUpAsync(Signup("Org 1", "dup@x.dev"));

            Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await using var db = TestDatabaseFixture.CreateContext(tenantId: null);
                await OrgSvc(db).SignUpAsync(Signup("Org 2", "dup@x.dev"));
            });
        }

        [Test]
        public async Task Invite_ThenAccept_CreatesMemberInInvitingTenant()
        {
            string tenantA, tenantB;
            await using (var db = TestDatabaseFixture.CreateContext(tenantId: null))
                tenantA = (await OrgSvc(db).SignUpAsync(Signup("A", "a@a.dev"))).OrganizationId;
            await using (var db = TestDatabaseFixture.CreateContext(tenantId: null))
                tenantB = (await OrgSvc(db).SignUpAsync(Signup("B", "b@b.dev"))).OrganizationId;

            // OrgAdmin de A convida um Member (tenant vem do contexto).
            string token;
            await using (var db = TestDatabaseFixture.CreateContext(tenantA))
                token = (await InviteSvc(db).CreateAsync("member@a.dev", Role.Member, null)).Token;

            // Aceite anônimo cria o usuário no tenant do convite (A).
            await using (var db = TestDatabaseFixture.CreateContext(tenantId: null))
            {
                var user = await InviteSvc(db).AcceptAsync(new AcceptInvitationRequest
                {
                    Token = token,
                    Name = "Membro",
                    Password = "secret123",
                });
                Assert.That(user, Is.Not.Null);
                Assert.That(user!.Role, Is.EqualTo(Role.Member));
                Assert.That(user.TenantId, Is.EqualTo(tenantA));
            }

            // Visível em A, invisível em B (isolamento).
            await using (var dbA = TestDatabaseFixture.CreateContext(tenantA))
                Assert.That(await dbA.Users.AnyAsync(u => u.Email == "member@a.dev"), Is.True);
            await using (var dbB = TestDatabaseFixture.CreateContext(tenantB))
                Assert.That(await dbB.Users.AnyAsync(u => u.Email == "member@a.dev"), Is.False);
        }

        [Test]
        public async Task Accept_ReturnsNull_ForUnknownToken()
        {
            await using var db = TestDatabaseFixture.CreateContext(tenantId: null);
            var user = await InviteSvc(db).AcceptAsync(new AcceptInvitationRequest
            {
                Token = "token-inexistente",
                Name = "X",
                Password = "secret123",
            });
            Assert.That(user, Is.Null);
        }

        [Test]
        public async Task Accept_Twice_SecondIsRejected()
        {
            string tenant;
            await using (var db = TestDatabaseFixture.CreateContext(tenantId: null))
                tenant = (await OrgSvc(db).SignUpAsync(Signup("C", "c@c.dev"))).OrganizationId;

            string token;
            await using (var db = TestDatabaseFixture.CreateContext(tenant))
                token = (await InviteSvc(db).CreateAsync("m@c.dev", Role.Member, null)).Token;

            await using (var db = TestDatabaseFixture.CreateContext(tenantId: null))
                await InviteSvc(db).AcceptAsync(new AcceptInvitationRequest { Token = token, Name = "M", Password = "secret123" });

            await using (var db = TestDatabaseFixture.CreateContext(tenantId: null))
            {
                var second = await InviteSvc(db).AcceptAsync(new AcceptInvitationRequest { Token = token, Name = "M2", Password = "secret123" });
                Assert.That(second, Is.Null, "convite já aceito não pode ser reutilizado");
            }
        }

        [Test]
        public void Invite_AsPlatformOwner_IsRejected()
        {
            Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await using var db = TestDatabaseFixture.CreateContext(Organization.DefaultOrganizationId);
                await InviteSvc(db).CreateAsync("x@x.dev", Role.PlatformOwner, null);
            });
        }

        [Test]
        public async Task Invite_SendsAcceptLinkToInvitee()
        {
            string tenant;
            await using (var db = TestDatabaseFixture.CreateContext(tenantId: null))
                tenant = (await OrgSvc(db).SignUpAsync(Signup("D", "d@d.dev"))).OrganizationId;

            var sender = new RecordingEmailSender();
            await using var ctx = TestDatabaseFixture.CreateContext(tenant);
            var result = await InviteSvc(ctx, sender).CreateAsync("novo@d.dev", Role.Member, null);

            Assert.That(sender.LastToEmail, Is.EqualTo("novo@d.dev"));
            Assert.That(sender.LastAcceptLink, Does.StartWith("agendify://accept-invite?token="));
            // O link carrega o token (URL-encoded) devolvido na resposta.
            Assert.That(sender.LastAcceptLink, Does.Contain(Uri.EscapeDataString(result.Token)));
        }
    }
}
