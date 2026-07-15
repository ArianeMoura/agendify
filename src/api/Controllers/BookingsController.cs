using api.Services;
using api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
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
        // Opções de JSON do próprio pipeline MVC. O corpo guardado para o replay idempotente
        // precisa sair idêntico ao da resposta original — com Serialize() sem opções ele saía
        // em PascalCase, enquanto a resposta normal vai em camelCase, e o replay devolvia um
        // shape diferente do original (quebrando clientes, que são case-sensitive).
        private readonly JsonSerializerOptions _jsonOptions;

        public BookingsController(
            BookingsService bookingsService,
            IdempotencyService idempotencyService,
            IOptions<JsonOptions> jsonOptions)
        {
            _bookingsService = bookingsService;
            _idempotencyService = idempotencyService;
            _jsonOptions = jsonOptions.Value.JsonSerializerOptions;
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
        public async Task<IActionResult> Post(CreateBookingRequest request)
        {
            var userId = CurrentUserId ?? request.UserId ?? string.Empty;

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
            var ownerId = IsAdmin() ? (request.UserId ?? userId) : userId;

            var newBooking = new Booking
            {
                Id = Guid.NewGuid().ToString(),
                UserId = ownerId,
                SpaceId = request.SpaceId,
                // !.Value: o [Required] do DTO já garantiu que as datas vieram.
                StartDateTime = ToUtc(request.StartDateTime!.Value),
                EndDateTime = ToUtc(request.EndDateTime!.Value),
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
                var body = JsonSerializer.Serialize(created, _jsonOptions);
                await _idempotencyService.SaveAsync(idemKey, userId, StatusCodes.Status201Created, body);
            }

            return CreatedAtAction(nameof(Post), new { id = created.Id }, created);
        }

        [HttpPut()]
        [Authorize(Policy = "Member")]
        public async Task<IActionResult> Put(UpdateBookingRequest request)
        {
            var dbBooking = await _bookingsService.GetById(request.Id);

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
                SpaceId = request.SpaceId,
                StartDateTime = ToUtc(request.StartDateTime!.Value),
                EndDateTime = ToUtc(request.EndDateTime!.Value),
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
