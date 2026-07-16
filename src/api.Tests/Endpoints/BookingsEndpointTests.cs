using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using api.Models;
using NUnit.Framework;

namespace api.Tests.Endpoints;

// Testes do PIPELINE HTTP de /api/bookings — model binding incluso. Os testes de service
// chamam BookingsService direto e por isso nunca viram o 400 do TenantId: a entidade de
// domínio era bindada crua e o [Required] implícito rejeitava o request antes da action.
// Os payloads aqui são cópias fiéis do que admin e mobile enviam.
//
// Não marcar como [Parallelizable]: ResetAsync() dá TRUNCATE global e o assembly roda
// sequencial (ParallelScope.None) — paralelizar criaria corrida com os testes de service.
[TestFixture]
public class BookingsEndpointTests
{
    private const string MemberId = "11111111-1111-1111-1111-111111111111";
    private const string OtherMemberId = "44444444-4444-4444-4444-444444444444";
    private const string AdminId = "55555555-5555-5555-5555-555555555555";
    private const string SpaceId = "22222222-2222-2222-2222-222222222222";
    private const string Tenant = Organization.DefaultOrganizationId;

    private ApiFactory _factory = null!;

    private static DateTime Future(int daysAhead, int hour) =>
        DateTime.SpecifyKind(DateTime.UtcNow.Date.AddDays(daysAhead).AddHours(hour), DateTimeKind.Utc);

    private static string Iso(DateTime dt) => dt.ToString("yyyy-MM-ddTHH:mm:ssZ");

    [OneTimeSetUp]
    public void OneTimeSetUp()
    {
        ApiFactory.SetEnvironment();
        _factory = new ApiFactory();
    }

    [OneTimeTearDown]
    public void OneTimeTearDown() => _factory.Dispose();

    [SetUp]
    public async Task SetUp()
    {
        await TestDatabaseFixture.ResetAsync();

        await using var db = TestDatabaseFixture.CreateContext();
        db.Users.Add(new User
        {
            Id = MemberId,
            Name = "João Silva",
            Email = "joao@exemplo.com.br",
            Password = "hash",
            Role = Role.Member,
        });
        db.Users.Add(new User
        {
            Id = OtherMemberId,
            Name = "Maria Souza",
            Email = "maria@exemplo.com.br",
            Password = "hash",
            Role = Role.Member,
        });
        db.Users.Add(new User
        {
            Id = AdminId,
            Name = "Ana Admin",
            Email = "ana@exemplo.com.br",
            Password = "hash",
            Role = Role.OrgAdmin,
        });
        db.Spaces.Add(new Space
        {
            Id = SpaceId,
            Name = "Sala de Conferência A",
            Capacity = 20,
            Availability = true,
        });
        await db.SaveChangesAsync();
    }

    private HttpClient ClientAs(string userId, string role)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", ApiFactory.Token(userId, role, Tenant));
        return client;
    }

    private static StringContent Json(string body) =>
        new(body, Encoding.UTF8, "application/json");

    // Reserializa o JSON para comparar dois corpos ignorando diferenças de encoder,
    // mas preservando os nomes das propriedades.
    private static string Canonical(string json) =>
        JsonSerializer.Serialize(JsonDocument.Parse(json).RootElement);

    // ---- POST ----

    [Test]
    public async Task Post_SemTenantId_PayloadDoAdmin_Retorna201()
    {
        var client = ClientAs(MemberId, "Member");
        var body = $@"{{""userId"":""{MemberId}"",""spaceId"":""{SpaceId}"",
                ""startDateTime"":""{Iso(Future(1, 10))}"",""endDateTime"":""{Iso(Future(1, 11))}""}}";

        var response = await client.PostAsync("/api/bookings", Json(body));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created),
            await response.Content.ReadAsStringAsync());
    }

    [Test]
    public async Task Post_SemTenantId_PayloadDoMobilePascalCase_Retorna201()
    {
        var client = ClientAs(MemberId, "Member");
        var body = $@"{{""UserId"":""{MemberId}"",""SpaceId"":""{SpaceId}"",
                ""StartDateTime"":""{Iso(Future(1, 10))}"",""EndDateTime"":""{Iso(Future(1, 11))}""}}";

        var response = await client.PostAsync("/api/bookings", Json(body));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created),
            await response.Content.ReadAsStringAsync());
    }

    // O tenant é do servidor: prova que o auto-stamp cobre o caminho HTTP inteiro.
    [Test]
    public async Task Post_CarimbaTenantDoToken()
    {
        var client = ClientAs(MemberId, "Member");
        var body = $@"{{""spaceId"":""{SpaceId}"",""startDateTime"":""{Iso(Future(1, 10))}"",
                ""endDateTime"":""{Iso(Future(1, 11))}""}}";

        await client.PostAsync("/api/bookings", Json(body));

        await using var db = TestDatabaseFixture.CreateContext();
        var saved = db.Bookings.Single();
        Assert.That(saved.TenantId, Is.EqualTo(Tenant));
    }

    // Propriedade de segurança que o DTO garante: tenantId no corpo é ignorado, e não
    // aceito. Sem o DTO, o campo existe no contrato — e StampTenant() não sobrescreve
    // valor já preenchido, então só o RLS impediria a escrita cruzada.
    [Test]
    public async Task Post_ComTenantIdDeOutroTenant_IgnoraOCampo()
    {
        var client = ClientAs(MemberId, "Member");
        var body = $@"{{""tenantId"":""99999999-9999-9999-9999-999999999999"",
                ""spaceId"":""{SpaceId}"",""startDateTime"":""{Iso(Future(1, 10))}"",
                ""endDateTime"":""{Iso(Future(1, 11))}""}}";

        var response = await client.PostAsync("/api/bookings", Json(body));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created),
            await response.Content.ReadAsStringAsync());
        await using var db = TestDatabaseFixture.CreateContext();
        Assert.That(db.Bookings.Single().TenantId, Is.EqualTo(Tenant));
    }

    [Test]
    public async Task Post_SlotOcupado_Retorna409()
    {
        var client = ClientAs(MemberId, "Member");
        var body = $@"{{""spaceId"":""{SpaceId}"",""startDateTime"":""{Iso(Future(2, 9))}"",
                ""endDateTime"":""{Iso(Future(2, 10))}""}}";

        await client.PostAsync("/api/bookings", Json(body));
        var conflict = await client.PostAsync("/api/bookings", Json(body));

        Assert.That(conflict.StatusCode, Is.EqualTo(HttpStatusCode.Conflict));
    }

    // Protege a idempotência (RNF-014) durante a troca de assinatura do controller.
    [Test]
    public async Task Post_ComIdempotencyKey_ReplayDevolveMesmoCorpo()
    {
        var client = ClientAs(MemberId, "Member");
        var body = $@"{{""spaceId"":""{SpaceId}"",""startDateTime"":""{Iso(Future(3, 14))}"",
                ""endDateTime"":""{Iso(Future(3, 15))}""}}";

        var first = await client.SendAsync(new HttpRequestMessage(HttpMethod.Post, "/api/bookings")
        {
            Content = Json(body),
            Headers = { { "Idempotency-Key", "chave-fixa-123" } },
        });
        var replay = await client.SendAsync(new HttpRequestMessage(HttpMethod.Post, "/api/bookings")
        {
            Content = Json(body),
            Headers = { { "Idempotency-Key", "chave-fixa-123" } },
        });

        Assert.That(first.StatusCode, Is.EqualTo(HttpStatusCode.Created),
            await first.Content.ReadAsStringAsync());
        Assert.That(replay.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        // Compara o JSON canônico, não os bytes: o formatter do MVC troca o encoder por
        // UnsafeRelaxedJsonEscaping quando ele é nulo, então a resposta original manda "ã"
        // cru e o corpo reserializado manda "ã" — equivalentes ao parsear. O que
        // importa (e o que já esteve quebrado) são os nomes das propriedades: o corpo do
        // replay era gravado em PascalCase e voltava com shape diferente do original.
        Assert.That(Canonical(await replay.Content.ReadAsStringAsync()),
            Is.EqualTo(Canonical(await first.Content.ReadAsStringAsync())));
        await using var db = TestDatabaseFixture.CreateContext();
        Assert.That(db.Bookings.Count(), Is.EqualTo(1), "O replay não deve criar segunda reserva.");
    }

    // Member não reserva em nome de outro: o controller ignora o userId do corpo.
    [Test]
    public async Task Post_MemberTentandoReservarParaOutro_UsaOProprioUsuario()
    {
        var client = ClientAs(MemberId, "Member");
        var body = $@"{{""userId"":""{OtherMemberId}"",""spaceId"":""{SpaceId}"",
                ""startDateTime"":""{Iso(Future(4, 10))}"",""endDateTime"":""{Iso(Future(4, 11))}""}}";

        await client.PostAsync("/api/bookings", Json(body));

        await using var db = TestDatabaseFixture.CreateContext();
        Assert.That(db.Bookings.Single().UserId, Is.EqualTo(MemberId));
    }

    [Test]
    public async Task Post_AdminReservandoParaOutro_UsaOUsuarioDoCorpo()
    {
        var client = ClientAs(AdminId, "OrgAdmin");
        var body = $@"{{""userId"":""{OtherMemberId}"",""spaceId"":""{SpaceId}"",
                ""startDateTime"":""{Iso(Future(4, 10))}"",""endDateTime"":""{Iso(Future(4, 11))}""}}";

        await client.PostAsync("/api/bookings", Json(body));

        await using var db = TestDatabaseFixture.CreateContext();
        Assert.That(db.Bookings.Single().UserId, Is.EqualTo(OtherMemberId));
    }

    // ---- PUT ----

    private async Task<string> SeedBookingAsync(string userId, int daysAhead)
    {
        var client = ClientAs(userId, "Member");
        var body = $@"{{""spaceId"":""{SpaceId}"",""startDateTime"":""{Iso(Future(daysAhead, 10))}"",
                ""endDateTime"":""{Iso(Future(daysAhead, 11))}""}}";
        var created = await client.PostAsync("/api/bookings", Json(body));
        var json = JsonDocument.Parse(await created.Content.ReadAsStringAsync());
        return json.RootElement.GetProperty("id").GetString()!;
    }

    [Test]
    public async Task Put_SemTenantId_PayloadDoMobile_Retorna200()
    {
        var id = await SeedBookingAsync(MemberId, 5);
        var client = ClientAs(MemberId, "Member");
        var body = $@"{{""Id"":""{id}"",""SpaceId"":""{SpaceId}"",
                ""StartDateTime"":""{Iso(Future(5, 14))}"",""EndDateTime"":""{Iso(Future(5, 15))}""}}";

        var response = await client.PutAsync("/api/bookings", Json(body));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK),
            await response.Content.ReadAsStringAsync());
        await using var db = TestDatabaseFixture.CreateContext();
        Assert.That(db.Bookings.Single().StartDateTime, Is.EqualTo(Future(5, 14)));
    }

    [Test]
    public async Task Put_DeOutroMember_Retorna403()
    {
        var id = await SeedBookingAsync(MemberId, 6);
        var client = ClientAs(OtherMemberId, "Member");
        var body = $@"{{""id"":""{id}"",""spaceId"":""{SpaceId}"",
                ""startDateTime"":""{Iso(Future(6, 14))}"",""endDateTime"":""{Iso(Future(6, 15))}""}}";

        var response = await client.PutAsync("/api/bookings", Json(body));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    public async Task Put_PreservaODono_QuandoAdminEdita()
    {
        var id = await SeedBookingAsync(MemberId, 7);
        var client = ClientAs(AdminId, "OrgAdmin");
        var body = $@"{{""id"":""{id}"",""spaceId"":""{SpaceId}"",
                ""startDateTime"":""{Iso(Future(7, 14))}"",""endDateTime"":""{Iso(Future(7, 15))}""}}";

        await client.PutAsync("/api/bookings", Json(body));

        await using var db = TestDatabaseFixture.CreateContext();
        Assert.That(db.Bookings.Single().UserId, Is.EqualTo(MemberId),
            "O PUT não deve reatribuir a reserva a quem editou.");
    }

    [Test]
    public async Task Put_Inexistente_Retorna404()
    {
        var client = ClientAs(MemberId, "Member");
        var body = $@"{{""id"":""00000000-0000-0000-0000-000000000000"",""spaceId"":""{SpaceId}"",
                ""startDateTime"":""{Iso(Future(8, 14))}"",""endDateTime"":""{Iso(Future(8, 15))}""}}";

        var response = await client.PutAsync("/api/bookings", Json(body));

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }
}
