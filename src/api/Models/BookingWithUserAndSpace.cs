namespace api.Models;

// Projeção de leitura: reserva com o usuário e o espaço já resolvidos.
// Populada manualmente pelo BookingsService (não é entidade do EF).
public class BookingWithUserAndSpace : Booking
{
    // UserDto, não a entidade User: embutir a entidade fazia GET /api/bookings serializar
    // o hash da senha (User.Password), o TenantId e o AnonymizedAt de cada usuário do
    // tenant. O DTO expõe só o que os clientes declaram (id/name/email/role/createdAt).
    public UserDto? User { get; set; } = null;
    public Space? Space { get; set; } = null;
}
