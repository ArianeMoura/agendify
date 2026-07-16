namespace api.Models;

// Registra a resposta de uma operação idempotente (RNF-014). Uma retentativa
// com o mesmo (Key, UserId) devolve a resposta original em vez de criar de novo.
public class IdempotencyKey
{
    public string Key { get; set; } = null!;
    public string UserId { get; set; } = null!;
    public int ResponseStatus { get; set; }
    public string? ResponseBody { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
