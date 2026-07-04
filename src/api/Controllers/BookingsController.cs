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

        [HttpGet("{id}")]
        [Authorize(Roles = "Administrator, Common")]
        public async Task<IActionResult> Get(string id)
        {
            var booking = await _bookingsService.GetById(id);

            if (booking == null)
            {
                return NotFound();
            }

            return Ok(booking);
        }

        [HttpGet("user/{userId}")]
        [Authorize(Roles = "Administrator, Common")]
        public async Task<IActionResult> GetByUserId(string userId)
        {
            var bookings = await _bookingsService.GetByUserId(userId);
            return Ok(bookings);
        }

        [HttpGet]
        [Authorize(Roles = "Administrator, Common")]
        public async Task<List<BookingWithUserAndSpace>> Get() => await _bookingsService.GetAsync();

        [HttpPost]
        [Authorize(Roles = "Administrator, Common")]
        public async Task<IActionResult> Post(Booking booking)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? booking.UserId ?? string.Empty;

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

            var newBooking = new Booking
            {
                Id = Guid.NewGuid().ToString(),
                UserId = booking.UserId,
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
        [Authorize(Roles = "Administrator, Common")]
        public async Task<IActionResult> Put(Booking booking)
        {
            var dbBooking = await _bookingsService.GetById(booking.Id!);

            if (dbBooking == null)
            {
                return NotFound();
            }

            var updated = new Booking
            {
                Id = dbBooking.Id,
                UserId = booking.UserId,
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
        [Authorize(Roles = "Administrator, Common")]
        public async Task<IActionResult> Delete(string id)
        {
            await _bookingsService.Delete(id);

            return NoContent();
        }

        private static DateTime ToUtc(DateTime value) =>
            value.Kind == DateTimeKind.Utc ? value : DateTime.SpecifyKind(value, DateTimeKind.Utc);
    }
}
