namespace api.Services;

// Onde as imagens de espaço ficam guardadas. Duas implementações, escolhidas por
// configuração no Program.cs (mesmo padrão do IEmailSender): R2ImageStorage em produção
// e LocalImageStorage no disco para dev/testes.
//
// O valor retornado por SaveAsync é o que vai para Space.ImageUrl. Os dois clientes fazem
// `startsWith("http") ? url : API_ROOT + url`, então tanto o caminho relativo do disco
// quanto a URL absoluta do bucket funcionam sem mudança no front.
public interface IImageStorage
{
    // Grava o conteúdo e devolve a URL (ou caminho) público da imagem.
    Task<string> SaveAsync(Stream content, string extension, string contentType, CancellationToken ct = default);

    // Remove a imagem. Best-effort: falha aqui não deve derrubar a operação de negócio.
    Task DeleteAsync(string imageUrl, CancellationToken ct = default);
}
