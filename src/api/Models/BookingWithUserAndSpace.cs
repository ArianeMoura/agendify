namespace api.Models;

// Projeção de leitura: reserva com o usuário e o espaço já resolvidos.
// Populada manualmente pelo BookingsService (não é entidade do EF).
public class BookingWithUserAndSpace : Booking
{
    public User? User { get; set; } = null;
    public Space? Space { get; set; } = null;
}
