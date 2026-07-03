using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace api.Models
{
    // Entidade mínima de reserva para consultas de analytics
    public class Reserva
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        // Ajuste o nome do BsonElement se no Mongo o campo tiver outro nome
        [BsonElement("Inicio")]
        public DateTime Inicio { get; set; }

        [BsonElement("EspacoId")]
        public string EspacoId { get; set; } = null!;

        // Opcional, útil para exibição
        [BsonElement("EspacoNome")]
        public string? EspacoNome { get; set; }

        // Consideraremos apenas reservas confirmadas por padrão nas métricas
        [BsonElement("Status")]
        public string Status { get; set; } = "Confirmada";
    }
}