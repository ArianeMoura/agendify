namespace api.Services;

// Identifica o formato da imagem pelos BYTES, não pela extensão do nome que o cliente
// mandou. Antes a validação confiava só no nome do arquivo, então bytes arbitrários
// chamados "x.png" passavam. Vira crítico com storage externo: o content-type que
// gravamos no bucket é o que o navegador vai obedecer ao servir o objeto.
public static class ImageSignature
{
    public record ImageType(string Extension, string ContentType);

    // Assinaturas dos formatos que aceitamos. Bytes suficientes para o WEBP, que é o
    // maior: "RIFF" + 4 bytes de tamanho + "WEBP" = 12.
    private const int HeaderBytes = 12;

    // Detecta o formato lendo o início do stream, e o rebobina. Devolve null se os bytes
    // não corresponderem a nenhum formato aceito.
    public static async Task<ImageType?> DetectAsync(Stream stream, CancellationToken ct = default)
    {
        if (!stream.CanSeek)
            throw new ArgumentException("O stream precisa ser seekable para a detecção.", nameof(stream));

        var header = new byte[HeaderBytes];
        stream.Position = 0;
        var read = await stream.ReadAtLeastAsync(header, HeaderBytes, throwOnEndOfStream: false, ct);
        stream.Position = 0;

        return Detect(header.AsSpan(0, read));
    }

    private static ImageType? Detect(ReadOnlySpan<byte> header)
    {
        // JPEG: FF D8 FF
        if (header.Length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
            return new ImageType(".jpg", "image/jpeg");

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (header.StartsWith(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }))
            return new ImageType(".png", "image/png");

        // GIF: "GIF87a" ou "GIF89a"
        if (header.StartsWith("GIF8"u8))
            return new ImageType(".gif", "image/gif");

        // WEBP: "RIFF" ???? "WEBP"
        if (header.Length >= 12 && header.StartsWith("RIFF"u8) && header[8..12].SequenceEqual("WEBP"u8))
            return new ImageType(".webp", "image/webp");

        return null;
    }
}
