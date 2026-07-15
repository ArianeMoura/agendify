using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using api.Models;
using api.Services;
using NUnit.Framework;

namespace api.Tests.Endpoints
{
    // Pipeline HTTP de /api/spaces. É o controller mais frágil da API: recebe multipart e
    // desserializa a entidade Space à mão (JsonSerializer.Deserialize<Space>), escapando do
    // model binding — o que é justamente o motivo de ele nunca ter sofrido o 400 do TenantId.
    // Isso também significa que nada aqui era exercitado por teste até agora.
    [TestFixture]
    public class SpacesEndpointTests
    {
        private const string AdminId = "55555555-5555-5555-5555-555555555555";
        private const string MemberId = "11111111-1111-1111-1111-111111111111";
        private const string Tenant = Organization.DefaultOrganizationId;
        private const string OutroTenant = "99999999-9999-9999-9999-999999999999";

        private ApiFactory _factory = null!;

        [OneTimeSetUp]
        public void OneTimeSetUp()
        {
            ApiFactory.SetEnvironment();
            _factory = new ApiFactory();
        }

        [OneTimeTearDown]
        public void OneTimeTearDown() => _factory.Dispose();

        [SetUp]
        public async Task SetUp() => await TestDatabaseFixture.ResetAsync();

        private HttpClient ClientAs(string userId, string role)
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", ApiFactory.Token(userId, role, Tenant));
            return client;
        }

        // Monta o multipart que o admin envia: spaceData (JSON) + image opcional.
        private static MultipartFormDataContent Form(string spaceJson, byte[]? image = null)
        {
            var form = new MultipartFormDataContent { { new StringContent(spaceJson), "spaceData" } };
            if (image is not null)
            {
                var file = new ByteArrayContent(image);
                file.Headers.ContentType = new MediaTypeHeaderValue("image/png");
                form.Add(file, "image", "foto.png");
            }
            return form;
        }

        private static readonly byte[] Png =
            { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x01, 0x02, 0x03 };

        private const string SpaceJson =
            @"{""name"":""Sala de Reunião"",""capacity"":10,""availability"":true,
               ""availableHours"":[""08:00"",""09:00""]}";

        [Test]
        public async Task Post_ComoAdmin_Retorna201()
        {
            var client = ClientAs(AdminId, "OrgAdmin");

            var response = await client.PostAsync("/api/spaces", Form(SpaceJson));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created),
                await response.Content.ReadAsStringAsync());
        }

        [Test]
        public async Task Post_ComoMember_Retorna403()
        {
            var client = ClientAs(MemberId, "Member");

            var response = await client.PostAsync("/api/spaces", Form(SpaceJson));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        }

        [Test]
        public async Task Post_SemToken_Retorna401()
        {
            var client = _factory.CreateClient();

            var response = await client.PostAsync("/api/spaces", Form(SpaceJson));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
        }

        [Test]
        public async Task Post_CarimbaTenantDoToken()
        {
            var client = ClientAs(AdminId, "OrgAdmin");

            await client.PostAsync("/api/spaces", Form(SpaceJson));

            await using var db = TestDatabaseFixture.CreateContext();
            Assert.That(db.Spaces.Single().TenantId, Is.EqualTo(Tenant));
        }

        // O Deserialize<Space> aceita "tenantId" dentro do spaceData — Space é ITenantScoped.
        // O controller não copia o campo ao montar a entidade, então o valor injetado morre
        // ali e o auto-stamp carimba o tenant do token. Este teste trava esse comportamento:
        // se alguém acrescentar `TenantId = space.TenantId` num refactor, cai aqui.
        [Test]
        public async Task Post_ComTenantIdInjetadoNoSpaceData_IgnoraOCampo()
        {
            var client = ClientAs(AdminId, "OrgAdmin");
            var malicioso = $@"{{""name"":""Invasora"",""capacity"":5,""availability"":true,
                ""tenantId"":""{OutroTenant}""}}";

            var response = await client.PostAsync("/api/spaces", Form(malicioso));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created),
                await response.Content.ReadAsStringAsync());
            await using var db = TestDatabaseFixture.CreateContext();
            Assert.That(db.Spaces.Single().TenantId, Is.EqualTo(Tenant),
                "O tenant tem de vir do token, nunca do corpo do request.");
        }

        [Test]
        public async Task Post_ComSpaceDataInvalido_Retorna400()
        {
            var client = ClientAs(AdminId, "OrgAdmin");

            var response = await client.PostAsync("/api/spaces", Form("isto não é json"));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        }

        // Sem Storage:Bucket nos testes, o LocalImageStorage grava em disco e devolve o
        // caminho relativo. O que importa aqui é o caminho HTTP inteiro do upload funcionar.
        [Test]
        public async Task Post_ComImagem_GravaImageUrl()
        {
            var client = ClientAs(AdminId, "OrgAdmin");

            var response = await client.PostAsync("/api/spaces", Form(SpaceJson, Png));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created),
                await response.Content.ReadAsStringAsync());
            await using var db = TestDatabaseFixture.CreateContext();
            Assert.That(db.Spaces.Single().ImageUrl, Does.StartWith("/uploads/").And.EndsWith(".png"));
        }

        // A validação por magic bytes vale no caminho HTTP: bytes que não são imagem são
        // recusados mesmo com nome e content-type de PNG.
        [Test]
        public async Task Post_ComArquivoQueNaoEImagem_Retorna400()
        {
            var client = ClientAs(AdminId, "OrgAdmin");
            var executavel = Encoding.UTF8.GetBytes("#!/bin/sh\nrm -rf /\n");

            var response = await client.PostAsync("/api/spaces", Form(SpaceJson, executavel));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
            await using var db = TestDatabaseFixture.CreateContext();
            Assert.That(db.Spaces.Count(), Is.Zero, "Nada deveria ter sido criado.");
        }

        [Test]
        public async Task Get_ComoMember_Retorna200()
        {
            var admin = ClientAs(AdminId, "OrgAdmin");
            await admin.PostAsync("/api/spaces", Form(SpaceJson));

            var response = await ClientAs(MemberId, "Member").GetAsync("/api/spaces");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        }

        // Isolamento por tenant através do HTTP: quem está em outro tenant não enxerga o espaço.
        [Test]
        public async Task Get_NaoVazaEspacosDeOutroTenant()
        {
            await using (var seed = TestDatabaseFixture.CreateContext(tenantId: null, isPlatformOwner: true))
            {
                seed.Organizations.Add(new Organization
                {
                    Id = OutroTenant, Name = "Outra Org", Slug = "outra", Status = "active",
                });
                seed.Spaces.Add(new Space
                {
                    Id = Guid.NewGuid().ToString(), TenantId = OutroTenant,
                    Name = "Sala da Outra Org", Capacity = 4, Availability = true,
                });
                await seed.SaveChangesAsync();
            }

            var response = await ClientAs(AdminId, "OrgAdmin").GetAsync("/api/spaces");

            var body = await response.Content.ReadAsStringAsync();
            Assert.That(body, Does.Not.Contain("Sala da Outra Org"));
        }

        [Test]
        public async Task Put_AtualizaOEspaco()
        {
            var client = ClientAs(AdminId, "OrgAdmin");
            var created = await client.PostAsync("/api/spaces", Form(SpaceJson));
            var id = JsonDocument.Parse(await created.Content.ReadAsStringAsync())
                .RootElement.GetProperty("id").GetString()!;

            var response = await client.PutAsync("/api/spaces",
                Form($@"{{""id"":""{id}"",""name"":""Sala Renomeada"",""capacity"":20,""availability"":true}}"));

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK),
                await response.Content.ReadAsStringAsync());
            await using var db = TestDatabaseFixture.CreateContext();
            Assert.That(db.Spaces.Single().Name, Is.EqualTo("Sala Renomeada"));
        }

        [Test]
        public async Task Delete_RemoveOEspaco()
        {
            var client = ClientAs(AdminId, "OrgAdmin");
            var created = await client.PostAsync("/api/spaces", Form(SpaceJson));
            var id = JsonDocument.Parse(await created.Content.ReadAsStringAsync())
                .RootElement.GetProperty("id").GetString()!;

            var response = await client.DeleteAsync($"/api/spaces/{id}");

            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            await using var db = TestDatabaseFixture.CreateContext();
            Assert.That(db.Spaces.Count(), Is.Zero);
        }
    }
}
