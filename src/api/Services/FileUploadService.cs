namespace api.Services
{
    public class FileUploadService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<FileUploadService> _logger;
        private const string UploadFolder = "uploads";
        private readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        private const long MaxFileSize = 5 * 1024 * 1024; // 5MB
        private readonly string _uploadPath;

        public FileUploadService(IWebHostEnvironment environment, ILogger<FileUploadService> logger)
        {
            _environment = environment;
            _logger = logger;
            _uploadPath = GetUploadBasePath();
            EnsureUploadFolderExists();
        }

        private string GetUploadBasePath()
        {
            var websiteName = Environment.GetEnvironmentVariable("WEBSITE_SITE_NAME");
            if (!string.IsNullOrEmpty(websiteName))
            {
                var azurePath = Path.Combine("D:\\home", UploadFolder);
                _logger.LogInformation("Running on Azure. Using persistent storage: {Path}", azurePath);
                return azurePath;
            }
            else
            {
                var localPath = Path.Combine(_environment.ContentRootPath, UploadFolder);
                _logger.LogInformation("Running locally. Using: {Path}", localPath);
                return localPath;
            }
        }

        private void EnsureUploadFolderExists()
        {
            if (!Directory.Exists(_uploadPath))
            {
                Directory.CreateDirectory(_uploadPath);
                _logger.LogInformation("Created uploads folder at: {UploadPath}", _uploadPath);
            }
        }

        public async Task<string?> SaveImageAsync(IFormFile? file, string? oldImageUrl = null)
        {
            if (file == null || file.Length == 0)
            {
                return null;
            }

            if (file.Length > MaxFileSize)
            {
                throw new InvalidOperationException($"File size exceeds maximum allowed size of {MaxFileSize / (1024 * 1024)}MB");
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
            {
                throw new InvalidOperationException($"File type {extension} is not allowed. Allowed types: {string.Join(", ", AllowedExtensions)}");
            }

            if (!string.IsNullOrWhiteSpace(oldImageUrl))
            {
                DeleteImage(oldImageUrl);
            }

            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(_uploadPath, fileName);

            try
            {
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                _logger.LogInformation("Image saved successfully: {FileName}", fileName);
                return $"/{UploadFolder}/{fileName}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving image: {FileName}", fileName);
                throw;
            }
        }

        public void DeleteImage(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
            {
                return;
            }

            try
            {
                var fileName = Path.GetFileName(imageUrl);
                var filePath = Path.Combine(_uploadPath, fileName);

                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    _logger.LogInformation("Deleted image: {FileName}", fileName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image: {ImageUrl}", imageUrl);
            }
        }
    }
}

