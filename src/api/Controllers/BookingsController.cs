using api.Services;
using api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text.Json;

namespace api.Controllers
{
    [ApiController]
    [Route("api/bookings")]
    [Authorize]
    public class BookingsController : ControllerBase
    {
        private readonly BookingsService _bookingsService;
        private readonly IdempotencyService _idempotencyService;

        public BookingsController(BookingsService bookingsService, IdempotencyService idempotencyService)
        {
            _bookingsService = bookingsService;
            _idempotencyService = idempotencyService;
        }

        private string? CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        // Admin do tenant: OrgAdmin ou PlatformOwner. Enxerga/gerencia as reservas de
        // todos os membros do tenant; um Member só acessa as próprias. (O isolamento
        // entre tenants já é garantido pelo global query filter — isto é ownership
        // DENTRO do tenant.)
        private bool IsAdmin() => User.IsInRole("OrgAdmin") || User.IsInRole("PlatformOwner");

        [HttpGet("{id}")]
        [Authorize(Policy = "Member")]
        public async Task<IActionResult> Get(string id)
        {
            var booking = await _bookingsService.GetById(id);

            if (booking == null)
            {
                return NotFound();
            }

            // Member não pode ver reserva de outro usuário (some como se não existisse).
            if (!IsAdmin() && booking.UserId != CurrentUserId)
            {
                return NotFound();
            }

            return Ok(booking);
        }

        [HttpGet("user/{userId}")]
        [Authorize(Policy = "Member")]
        public async Task<IActionResult> GetByUserId(string userId)
        {
            if (!IsAdmin() && userId != CurrentUserId)
            {
                return Forbid();
            }

            var bookings = await _bookingsService.GetByUserId(userId);
            return Ok(bookings);
        }

        [HttpGet]
        [Authorize(Policy = "Member")]
        public async Task<List<BookingWithUserAndSpace>> Get() =>
            // Admin vê todas as reservas do tenant; Member vê só as próprias.
            IsAdmin()
                ? await _bookingsService.GetAsync()
                : await _bookingsService.GetByUserId(CurrentUserId ?? string.Empty);

        [HttpPost]
        [Authorize(Policy = "Member")]
        public async Task<IActionResult> Post(Booking booking)
        {
            var userId = CurrentUserId ?? booking.UserId ?? string.Empty;

            // Idempotência (RNF-014): replay com a mesma chave devolve a resposta original.
            var idemKey = Request.Headers["Idempotency-Key"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(idemKey))
            {
                var prior = await _idempotencyService.GetAsync(idemKey, userId);
                if (prior != null)
                {
                    return new ContentResult
                    {
                        StatusCode = prior.ResponseStatus,
                        ContentType = "application/json",
                        Content = prior.ResponseBody
                    };
                }
            }

            // Member só reserva para si; admin pode reservar em nome de outro membro.
            var ownerId = IsAdmin() ? (booking.UserId ?? userId) : userId;

            var newBooking = new Booking
            {
                Id = Guid.NewGuid().ToString(),
                UserId = ownerId,
                SpaceId = booking.SpaceId,
                StartDateTime = ToUtc(booking.StartDateTime),
                EndDateTime = ToUtc(booking.EndDateTime),
            };

            try
            {
                await _bookingsService.Create(newBooking);
            }
            catch (BookingConflictException ex)
            {
                // O banco arbitrou o double-booking (exclusion constraint) → 409.
                return Conflict(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }

            var created = await _bookingsService.GetById(newBooking.Id!);
            if (created == null)
            {
                return NotFound();
            }

            if (!string.IsNullOrWhiteSpace(idemKey))
            {
                var body = JsonSerializer.Serialize(created);
                await _idempotencyService.SaveAsync(idemKey, userId, StatusCodes.Status201Created, body);
            }

            return CreatedAtAction(nameof(Post), new { id = created.Id }, created);
        }

        [HttpPut()]
        [Authorize(Policy = "Member")]
        public async Task<IActionResult> Put(Booking booking)
        {
            var dbBooking = await _bookingsService.GetById(booking.Id!);

            if (dbBooking == null)
            {
                return NotFound();
            }

            // Member só edita as próprias reservas.
            if (!IsAdmin() && dbBooking.UserId != CurrentUserId)
            {
                return Forbid();
            }

            var updated = new Booking
            {
                Id = dbBooking.Id,
                // Dono preservado: o PUT não reatribui a reserva a outro usuário.
                UserId = dbBooking.UserId,
                SpaceId = booking.SpaceId,
                StartDateTime = ToUtc(booking.StartDateTime),
                EndDateTime = ToUtc(booking.EndDateTime),
                Status = dbBooking.Status,
                CreatedAt = dbBooking.CreatedAt,
                UpdatedAt = DateTime.UtcNow,
            };

            try
            {
                await _bookingsService.Update(updated.Id!, updated);
            }
            catch (BookingConflictException ex)
            {
                // Editar para um slot ocupado também é rejeitado pelo banco → 409.
                return Conflict(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }

            var updatedBooking = await _bookingsService.GetById(updated.Id!);
            if (updatedBooking == null)
            {
                return NotFound();
            }

            return Ok(updatedBooking);
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "Member")]
        public async Task<IActionResult> Delete(string id)
        {
            var booking = await _bookingsService.GetById(id);
            if (booking == null)
            {
                return NoContent();
            }

            // Member só apaga as próprias reservas.
            if (!IsAdmin() && booking.UserId != CurrentUserId)
            {
                return Forbid();
            }

            await _bookingsService.Delete(id);

            return NoContent();
        }

        private static DateTime ToUtc(DateTime value) =>
            value.Kind == DateTimeKind.Utc ? value : DateTime.SpecifyKind(value, DateTimeKind.Utc);
    }
}
