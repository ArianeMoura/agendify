namespace api.Services
{
    // Grava no disco do próprio serviço, servido em /uploads pelo static files do Program.cs.
    // Serve dev e testes. Em produção o disco do Render é efêmero (as imagens somem a cada
    // deploy), e é por isso que existe o R2ImageStorage.
    public class LocalImageStorage : IImageStorage
    {
        public const string UploadFolder = "uploads";

        private readonly ILogger<LocalImageStorage> _logger;
        private readonly string _uploadPath;

        public LocalImageStorage(IWebHostEnvironment environment, ILogger<LocalImageStorage> logger)
        {
            _logger = logger;
            _uploadPath = Path.Combine(environment.ContentRootPath, UploadFolder);

            if (!Directory.Exists(_uploadPath))
            {
                Directory.CreateDirectory(_uploadPath);
                _logger.LogInformation("Created uploads folder at: {UploadPath}", _uploadPath);
            }
        }

        public async Task<string> SaveAsync(
            Stream content, string extension, string contentType, CancellationToken ct = default)
        {
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(_uploadPath, fileName);

            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await content.CopyToAsync(stream, ct);
            }

            _logger.LogInformation("Image saved successfully: {FileName}", fileName);
            return $"/{UploadFolder}/{fileName}";
        }

        public Task DeleteAsync(string imageUrl, CancellationToken ct = default)
        {
            try
            {
                // GetFileName também descarta qualquer tentativa de path traversal.
                var filePath = Path.Combine(_uploadPath, Path.GetFileName(imageUrl));

                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    _logger.LogInformation("Deleted image: {ImageUrl}", imageUrl);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image: {ImageUrl}", imageUrl);
            }

            return Task.CompletedTask;
        }
    }
}
