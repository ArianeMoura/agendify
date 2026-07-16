namespace api.Services;

// Valida a imagem enviada e delega a gravação ao IImageStorage (disco em dev, R2 em
// produção). A validação vive aqui, e não no storage, para valer igual nos dois destinos.
public class FileUploadService
{
    private readonly IImageStorage _storage;
    private readonly ILogger<FileUploadService> _logger;
    private const long MaxFileSize = 5 * 1024 * 1024; // 5MB

    public FileUploadService(IImageStorage storage, ILogger<FileUploadService> logger)
    {
        _storage = storage;
        _logger = logger;
    }

    public async Task<string?> SaveImageAsync(
        IFormFile? file, string? oldImageUrl = null, CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
        {
            return null;
        }

        if (file.Length > MaxFileSize)
        {
            throw new InvalidOperationException($"File size exceeds maximum allowed size of {MaxFileSize / (1024 * 1024)}MB");
        }

        // O formato sai dos bytes, não do nome do arquivo: a extensão é escolhida pelo
        // cliente e mentir nela é trivial.
        await using var content = file.OpenReadStream();
        var imageType = await ImageSignature.DetectAsync(content, ct)
            ?? throw new InvalidOperationException(
                "File is not a valid image. Allowed types: JPEG, PNG, GIF, WEBP");

        var imageUrl = await _storage.SaveAsync(content, imageType.Extension, imageType.ContentType, ct);

        // A antiga só sai depois que a nova está gravada. Na ordem inversa, uma falha na
        // escrita deixava o banco apontando para um arquivo já apagado.
        if (!string.IsNullOrWhiteSpace(oldImageUrl))
        {
            await _storage.DeleteAsync(oldImageUrl, ct);
        }

        return imageUrl;
    }

    public async Task DeleteImageAsync(string? imageUrl, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
        {
            return;
        }

        await _storage.DeleteAsync(imageUrl, ct);
    }
}
