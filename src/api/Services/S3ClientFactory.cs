using Amazon.Runtime;
using Amazon.S3;
using api.Models;

namespace api.Services;

// Cria o client S3 do jeito que o R2 exige. Fica isolado aqui para que os testes usem
// exatamente esta configuração, em vez de uma paralela que poderia divergir da produção.
public static class S3ClientFactory
{
    public static IAmazonS3 Create(StorageSettings settings) =>
        new AmazonS3Client(
            new BasicAWSCredentials(settings.AccessKeyId, settings.SecretAccessKey),
            new AmazonS3Config
            {
                ServiceURL = settings.ServiceUrl,
                // O R2 ignora a região, mas o SDK exige uma; "auto" é o que a Cloudflare documenta.
                AuthenticationRegion = "auto",
                // Bucket no caminho, não no host: vale no R2 e é o que o MinIO dos testes exige.
                ForcePathStyle = true,
                // O SDK v4 passou a mandar checksum CRC32 por padrão em PutObject, e o R2
                // responde erro de header. WHEN_REQUIRED só manda quando a operação exige.
                RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
                ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED,
            });
}
