using Microsoft.AspNetCore.Http;

namespace api.Models
{
    // Agrupa os campos enviados via multipart/form-data ao criar/editar um Space.
    // Consolidar o IFormFile como propriedade de um único parâmetro [FromForm] permite
    // que o Swashbuckle gere corretamente o schema de upload no swagger.json.
    public class SpaceFormRequest
    {
        // JSON serializado do Space (desserializado no controller).
        public string SpaceData { get; set; } = string.Empty;

        public IFormFile? Image { get; set; }
    }
}
