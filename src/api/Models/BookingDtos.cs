using System.ComponentModel.DataAnnotations;

namespace api.Models;

// Corpo aceito em POST /api/bookings. Sem TenantId de propósito: o tenant vem da claim do
// JWT e é carimbado no SaveChanges. Bindar a entidade Booking aqui é o que fazia o
// [ApiController] exigir TenantId do cliente e responder 400.
public class CreateBookingRequest
{
    // Anulável: Member não envia (reserva sempre para si) e OrgAdmin pode enviar para
    // reservar em nome de outro. Declarar como string não-anulável reintroduziria o mesmo
    // [Required] implícito que quebrou o TenantId.
    public string? UserId { get; set; }

    [Required]
    public string SpaceId { get; set; } = string.Empty;

    // DateTime? + [Required]: em tipo de valor não-anulável o [Required] passa sempre, e uma
    // data ausente viraria 0001-01-01 silenciosamente.
    [Required]
    public DateTime? StartDateTime { get; set; }

    [Required]
    public DateTime? EndDateTime { get; set; }
}

// Corpo aceito em PUT /api/bookings — o id vem no corpo, não na rota. Não há UserId: o PUT
// preserva o dono da reserva e não a reatribui.
public class UpdateBookingRequest
{
    [Required]
    public string Id { get; set; } = string.Empty;

    [Required]
    public string SpaceId { get; set; } = string.Empty;

    [Required]
    public DateTime? StartDateTime { get; set; }

    [Required]
    public DateTime? EndDateTime { get; set; }
}
