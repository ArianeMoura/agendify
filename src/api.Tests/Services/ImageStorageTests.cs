using System.Net;
using Amazon.S3;
using Amazon.S3.Model;
using api.Models;
using api.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NUnit.Framework;
using Testcontainers.Minio;

namespace api.Tests.Services;

// Exercita o R2ImageStorage contra um MinIO real (Testcontainers), que fala o mesmo
// protocolo S3 do R2. Assim o caminho de upload — hoje sem cobertura nenhuma — é testado
// de verdade, sem depender de conta na Cloudflare nem de rede.
[TestFixture]
public class ImageStorageTests
{
    private const string Bucket = "agendify-test";
    private const string PublicBaseUrl = "https://cdn.exemplo.test";

    private MinioContainer _minio = null!;
    private IAmazonS3 _s3 = null!;
    private R2ImageStorage _storage = null!;

    [OneTimeSetUp]
    public async Task OneTimeSetUp()
    {
        _minio = new MinioBuilder().WithImage("minio/minio:RELEASE.2024-10-13T13-34-11Z").Build();
        await _minio.StartAsync();

        var settings = new StorageSettings
        {
            ServiceUrl = _minio.GetConnectionString(),
            Bucket = Bucket,
            AccessKeyId = _minio.GetAccessKey(),
            SecretAccessKey = _minio.GetSecretKey(),
            PublicBaseUrl = PublicBaseUrl,
        };

        // Mesma factory da produção: o teste exercita a config real, não uma paralela.
        _s3 = S3ClientFactory.Create(settings);
        await _s3.PutBucketAsync(Bucket);

        _storage = new R2ImageStorage(
            _s3, Options.Create(settings), NullLogger<R2ImageStorage>.Instance);
    }

    [OneTimeTearDown]
    public async Task OneTimeTearDown()
    {
        _s3?.Dispose();
        await _minio.DisposeAsync();
    }

    // PNG mínimo válido: assinatura + IHDR truncado basta para a detecção por magic bytes.
    private static MemoryStream PngStream() =>
        new(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x01, 0x02, 0x03 });

    [Test]
    public async Task SaveAsync_PersisteObjetoEDevolveUrlPublica()
    {
        var url = await _storage.SaveAsync(PngStream(), ".png", "image/png");

        Assert.That(url, Does.StartWith($"{PublicBaseUrl}/spaces/"));
        Assert.That(url, Does.EndWith(".png"));

        // O objeto existe mesmo no bucket — e com o content-type que gravamos.
        var key = url[(PublicBaseUrl.Length + 1)..];
        var obj = await _s3.GetObjectAsync(Bucket, key);
        Assert.That(obj.Headers.ContentType, Is.EqualTo("image/png"));
    }

    [Test]
    public async Task SaveAsync_GeraChavesDistintas_ParaCadaUpload()
    {
        var first = await _storage.SaveAsync(PngStream(), ".png", "image/png");
        var second = await _storage.SaveAsync(PngStream(), ".png", "image/png");

        Assert.That(first, Is.Not.EqualTo(second));
    }

    [Test]
    public async Task DeleteAsync_RemoveOObjeto()
    {
        var url = await _storage.SaveAsync(PngStream(), ".png", "image/png");
        var key = url[(PublicBaseUrl.Length + 1)..];

        await _storage.DeleteAsync(url);

        var ex = Assert.ThrowsAsync<NoSuchKeyException>(async () => await _s3.GetObjectAsync(Bucket, key));
        Assert.That(ex!.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    // Best-effort: apagar imagem inexistente não pode derrubar a exclusão do espaço.
    [Test]
    public void DeleteAsync_NaoLanca_QuandoObjetoNaoExiste()
    {
        Assert.DoesNotThrowAsync(async () =>
            await _storage.DeleteAsync($"{PublicBaseUrl}/spaces/nao-existe.png"));
    }

    [Test]
    public async Task DeleteAsync_NaoLanca_QuandoUrlNaoTemOPrefixoPublico()
    {
        // Imagens gravadas antes da migração para o bucket têm caminho relativo.
        Assert.DoesNotThrowAsync(async () => await _storage.DeleteAsync("/uploads/antiga.png"));
        await Task.CompletedTask;
    }
}
