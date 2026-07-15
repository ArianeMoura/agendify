namespace api.Models;

// Configuração do storage de imagens (seção "Storage"). Com Bucket/AccessKeyId/SecretAccessKey
// preenchidos, a API grava no R2; sem eles, cai no disco local (dev/testes). Mesma mecânica de
// seleção do Email → Resend/Logging.
public class StorageSettings
{
    // Endpoint S3. No R2: https://{account_id}.r2.cloudflarestorage.com
    // (nos testes, o endereço do MinIO).
    public string? ServiceUrl { get; set; }

    public string? Bucket { get; set; }

    public string? AccessKeyId { get; set; }

    public string? SecretAccessKey { get; set; }

    // Base pública de leitura: o domínio r2.dev do bucket ou um domínio próprio. É o que vai
    // gravado em Space.ImageUrl, então precisa ser alcançável pelos clientes.
    public string? PublicBaseUrl { get; set; }
}
