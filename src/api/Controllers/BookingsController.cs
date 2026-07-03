using api.Services;
using api.Models;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using Microsoft.AspNetCore.Authorization;

namespace api.Controllers
{
    [ApiController]
    [Route("api/bookings")]
    [Authorize]
    public class BookingsController : ControllerBase
    {
        private readonly BookingsService _bookingsService;

        public BookingsController(BookingsService bookingsService)
        {
            _bookingsService = bookingsService;
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Administrator, Common")]
        public async Task<IActionResult> Get(string id)
        {
            var booking = await _bookingsService.GetById(ObjectId.Parse(id).ToString());

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
            var bookings = await _bookingsService.GetByUserId(ObjectId.Parse(userId).ToString());

            if (bookings == null)
            {
                return NotFound();
            }

            return Ok(bookings);
        }

        [HttpGet]
        [Authorize(Roles = "Administrator, Common")]
        public async Task<List<BookingWithUserAndSpace>> Get() => await _bookingsService.GetAsync();

        [HttpPost]
        [Authorize(Roles = "Administrator, Common")]
        public async Task<IActionResult> Post(Booking booking)
        {
            var startUtc = booking.StartDateTime.Kind == DateTimeKind.Utc 
                ? booking.StartDateTime 
                : DateTime.SpecifyKind(booking.StartDateTime, DateTimeKind.Utc);
            var endUtc = booking.EndDateTime.Kind == DateTimeKind.Utc 
                ? booking.EndDateTime 
                : DateTime.SpecifyKind(booking.EndDateTime, DateTimeKind.Utc);

            var newBooking = new Booking
            {
                Id = ObjectId.GenerateNewId().ToString(),
                UserId = booking.UserId,
                SpaceId = booking.SpaceId,
                StartDateTime = startUtc,
                EndDateTime = endUtc,
            };

            await _bookingsService.Create(newBooking);

            newBooking = await _bookingsService.GetById(newBooking.Id!);

            if (newBooking == null)
            {
                return NotFound();
            }

            return CreatedAtAction(nameof(Post), new { id = newBooking.Id.ToString() }, newBooking);
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

            var startUtc = booking.StartDateTime.Kind == DateTimeKind.Utc 
                ? booking.StartDateTime 
                : DateTime.SpecifyKind(booking.StartDateTime, DateTimeKind.Utc);
            var endUtc = booking.EndDateTime.Kind == DateTimeKind.Utc 
                ? booking.EndDateTime 
                : DateTime.SpecifyKind(booking.EndDateTime, DateTimeKind.Utc);

            dbBooking.UserId = booking.UserId;
            dbBooking.SpaceId = booking.SpaceId;
            dbBooking.StartDateTime = startUtc;
            dbBooking.EndDateTime = endUtc;
            dbBooking.UpdatedAt = DateTime.UtcNow;

            await _bookingsService.Update(dbBooking.Id!, dbBooking);

            var updatedBooking = await _bookingsService.GetById(dbBooking.Id!);

            if (updatedBooking == null)
            {
                return NotFound();
            }

            return CreatedAtAction(nameof(Put), new { id = updatedBooking.Id.ToString() }, updatedBooking);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator, Common")]
        public async Task<IActionResult> Delete(string id)
        {
            await _bookingsService.Delete(id);

            return NoContent();
        }
    }
}