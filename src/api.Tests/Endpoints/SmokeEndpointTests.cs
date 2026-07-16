using System.Net;
using NUnit.Framework;

namespace api.Tests.Endpoints;

// Verifica só que a API sobe sob o WebApplicationFactory: boot sem fail-fast de
// segredos, sem tentar migrar com o papel restrito, e sem redirect de HTTPS atrapalhando
// o client de teste. Se os testes de endpoint quebrarem em bloco, comece por aqui.
[TestFixture]
public class SmokeEndpointTests
{
    private ApiFactory _factory = null!;

    [OneTimeSetUp]
    public void OneTimeSetUp()
    {
        ApiFactory.SetEnvironment();
        _factory = new ApiFactory();
    }

    [OneTimeTearDown]
    public void OneTimeTearDown() => _factory.Dispose();

    [Test]
    public async Task Status_Endpoint_Retorna200()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/status");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }
}
