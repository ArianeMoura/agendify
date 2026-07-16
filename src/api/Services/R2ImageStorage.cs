using Amazon.S3;
using Amazon.S3.Model;
using api.Models;
using Microsoft.Extensions.Options;

namespace api.Services;

// Guarda as imagens num bucket S3-compatível — o Cloudflare R2 em produção. Escolhido por
// ter egress gratuito (imagem é servida muito mais do que gravada) e por falar o protocolo
// S3, então o mesmo código roda contra o MinIO nos testes.
//
// Diferente do disco local, o objeto sobrevive a deploy e restart: era esse o bug — o
// filesystem do Render é efêmero e o banco seguia apontando para imagens que sumiram.
public class R2ImageStorage : IImageStorage
{
    private readonly IAmazonS3 _s3;
    private readonly StorageSettings _settings;
    private readonly ILogger<R2ImageStorage> _logger;
    private readonly bool _disablePayloadSigning;

    public R2ImageStorage(IAmazonS3 s3, IOptions<StorageSettings> settings, ILogger<R2ImageStorage> logger)
    {
        _s3 = s3;
        _settings = settings.Value;
        _logger = logger;

        // O R2 não implementa o Streaming SigV4 que o SDK usa por padrão, então lá isto
        // precisa ser desligado. Só que o SDK exige HTTPS para desligá-lo — e o MinIO dos
        // testes fala HTTP. Como o R2 é sempre HTTPS, derivar do esquema acerta os dois.
        _disablePayloadSigning =
            _settings.ServiceUrl?.StartsWith("https://", StringComparison.OrdinalIgnoreCase) == true;
    }

    public async Task<string> SaveAsync(
        Stream content, string extension, string contentType, CancellationToken ct = default)
    {
        var key = $"spaces/{Guid.NewGuid()}{extension}";

        await _s3.PutObjectAsync(new PutObjectRequest
        {
            BucketName = _settings.Bucket,
            Key = key,
            InputStream = content,
            // Vem da detecção por magic bytes, não do que o cliente declarou: é este valor
            // que o navegador vai obedecer ao servir o objeto.
            ContentType = contentType,
            DisablePayloadSigning = _disablePayloadSigning,
        }, ct);

        _logger.LogInformation("Image uploaded: {Key}", key);
        return $"{_settings.PublicBaseUrl!.TrimEnd('/')}/{key}";
    }

    public async Task DeleteAsync(string imageUrl, CancellationToken ct = default)
    {
        try
        {
            await _s3.DeleteObjectAsync(new DeleteObjectRequest
            {
                BucketName = _settings.Bucket,
                Key = KeyFromUrl(imageUrl),
            }, ct);

            _logger.LogInformation("Deleted image: {ImageUrl}", imageUrl);
        }
        catch (Exception ex)
        {
            // Best-effort, como no disco: um objeto órfão no bucket é bem menos grave do
            // que quebrar a exclusão do espaço.
            _logger.LogError(ex, "Error deleting image: {ImageUrl}", imageUrl);
        }
    }

    // Recupera a key a partir da URL pública gravada em Space.ImageUrl.
    private string KeyFromUrl(string imageUrl)
    {
        var prefix = $"{_settings.PublicBaseUrl!.TrimEnd('/')}/";
        return imageUrl.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
            ? imageUrl[prefix.Length..]
            : imageUrl.TrimStart('/');
    }
}
