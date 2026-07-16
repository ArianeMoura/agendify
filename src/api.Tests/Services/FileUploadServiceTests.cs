using System.Text;
using api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;

namespace api.Tests.Services;

// Valida o que o FileUploadService aceita. O ponto central é a detecção por magic bytes:
// antes a extensão vinha do nome do arquivo enviado pelo cliente, então qualquer conteúdo
// chamado "x.png" era gravado como PNG.
[TestFixture]
public class FileUploadServiceTests
{
    // Storage de mentira: registra o que recebeu, sem tocar em disco nem em rede.
    private class FakeStorage : IImageStorage
    {
        public string? SavedExtension;
        public string? SavedContentType;
        public List<string> Deleted = new();
        public bool ThrowOnSave;

        public Task<string> SaveAsync(Stream content, string extension, string contentType, CancellationToken ct = default)
        {
            if (ThrowOnSave) throw new IOException("falha simulada de escrita");
            SavedExtension = extension;
            SavedContentType = contentType;
            return Task.FromResult($"/uploads/nova{extension}");
        }

        public Task DeleteAsync(string imageUrl, CancellationToken ct = default)
        {
            Deleted.Add(imageUrl);
            return Task.CompletedTask;
        }
    }

    private FakeStorage _storage = null!;
    private FileUploadService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _storage = new FakeStorage();
        _service = new FileUploadService(_storage, NullLogger<FileUploadService>.Instance);
    }

    private static IFormFile FileWith(byte[] bytes, string fileName)
    {
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, stream.Length, "image", fileName);
    }

    private static readonly byte[] Png =
        { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x01, 0x02, 0x03 };
    private static readonly byte[] Jpeg = { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01 };

    [Test]
    public async Task SaveImageAsync_DetectaOFormatoPelosBytes_IgnorandoONome()
    {
        // Bytes de PNG, mas o cliente jurou que era .jpg.
        var url = await _service.SaveImageAsync(FileWith(Png, "mentira.jpg"));

        Assert.That(_storage.SavedExtension, Is.EqualTo(".png"));
        Assert.That(_storage.SavedContentType, Is.EqualTo("image/png"));
        Assert.That(url, Is.EqualTo("/uploads/nova.png"));
    }

    [Test]
    public async Task SaveImageAsync_AceitaJpeg()
    {
        await _service.SaveImageAsync(FileWith(Jpeg, "foto.jpg"));

        Assert.That(_storage.SavedContentType, Is.EqualTo("image/jpeg"));
    }

    // O caso que a validação por extensão deixava passar.
    [Test]
    public void SaveImageAsync_RejeitaBytesQueNaoSaoImagem_MesmoComNomeDeImagem()
    {
        var executavel = Encoding.UTF8.GetBytes("#!/bin/sh\nrm -rf /\n");

        var ex = Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.SaveImageAsync(FileWith(executavel, "inocente.png")));

        Assert.That(ex!.Message, Does.Contain("not a valid image"));
        Assert.That(_storage.SavedExtension, Is.Null, "Nada deveria ter sido gravado.");
    }

    [Test]
    public void SaveImageAsync_RejeitaArquivoAcimaDe5MB()
    {
        var grande = new byte[5 * 1024 * 1024 + 1];
        Png.CopyTo(grande, 0);

        var ex = Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.SaveImageAsync(FileWith(grande, "grande.png")));

        Assert.That(ex!.Message, Does.Contain("exceeds maximum"));
    }

    [Test]
    public async Task SaveImageAsync_DevolveNull_QuandoNaoHaArquivo()
    {
        Assert.That(await _service.SaveImageAsync(null), Is.Null);
        Assert.That(await _service.SaveImageAsync(FileWith(Array.Empty<byte>(), "vazio.png")), Is.Null);
    }

    [Test]
    public async Task SaveImageAsync_ApagaAAntiga_DepoisDeGravarANova()
    {
        await _service.SaveImageAsync(FileWith(Png, "nova.png"), oldImageUrl: "/uploads/antiga.png");

        Assert.That(_storage.Deleted, Is.EqualTo(new[] { "/uploads/antiga.png" }));
    }

    // A ordem importa: apagando antes, uma falha na escrita deixava o banco apontando
    // para um arquivo que já não existe.
    [Test]
    public void SaveImageAsync_NaoApagaAAntiga_SeAEscritaFalhar()
    {
        _storage.ThrowOnSave = true;

        Assert.ThrowsAsync<IOException>(async () =>
            await _service.SaveImageAsync(FileWith(Png, "nova.png"), oldImageUrl: "/uploads/antiga.png"));

        Assert.That(_storage.Deleted, Is.Empty, "A imagem antiga deve sobreviver a uma escrita que falhou.");
    }

    [Test]
    public async Task DeleteImageAsync_IgnoraUrlVazia()
    {
        await _service.DeleteImageAsync(null);
        await _service.DeleteImageAsync("   ");

        Assert.That(_storage.Deleted, Is.Empty);
    }
}
