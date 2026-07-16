using System.Text.Json;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/spaces")]
[Authorize]
public class SpacesController : ControllerBase
{
    private readonly SpacesService _spacesService;
    private readonly BookingsService _bookingsService;
    private readonly FileUploadService _fileUploadService;
    private readonly ILogger<SpacesController> _logger;

    public SpacesController(SpacesService spacesService, BookingsService bookingsService, FileUploadService fileUploadService, ILogger<SpacesController> logger)
    {
        _spacesService = spacesService;
        _bookingsService = bookingsService;
        _fileUploadService = fileUploadService;
        _logger = logger;
    }

    [HttpGet]
    // Allow all authenticated users to view spaces (needed for booking)
    public async Task<List<Space>> Get() => await _spacesService.GetAsync();

    [HttpGet("{id}")]
    [Authorize(Policy = "OrgAdmin")]
    public async Task<IActionResult> Get(string id)
    {
        var space = await _spacesService.GetById(id);

        if (space == null)
        {
            return NotFound();
        }

        return Ok(space);
    }

    [HttpGet("{id}/availability")]
    public async Task<IActionResult> GetAvailability(string id, [FromQuery] string date, [FromQuery] string? timezone = null)
    {
        try
        {
            var space = await _spacesService.GetById(id);
            if (space == null)
            {
                return NotFound("Space not found");
            }

            if (string.IsNullOrWhiteSpace(date) || !DateTime.TryParse(date, out DateTime selectedDate))
            {
                return BadRequest("Invalid date format. Use YYYY-MM-DD");
            }

            TimeZoneInfo timeZone;
            try
            {
                timeZone = string.IsNullOrWhiteSpace(timezone)
                    ? TimeZoneInfo.Utc
                    : TimeZoneInfo.FindSystemTimeZoneById(timezone);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Invalid timezone '{Timezone}', defaulting to UTC", timezone);
                timeZone = TimeZoneInfo.Utc;
            }

            var selectedDateInUserTz = DateTime.SpecifyKind(selectedDate, DateTimeKind.Unspecified);
            var startOfDayUtc = TimeZoneInfo.ConvertTimeToUtc(selectedDateInUserTz, timeZone);
            var endOfDayUtc = startOfDayUtc.AddDays(1);

            var bookings = await _bookingsService.GetAsync();
            var spaceBookings = bookings
                .Where(b => b.SpaceId == id &&
                            b.StartDateTime >= startOfDayUtc &&
                            b.StartDateTime < endOfDayUtc)
                .ToList();

            var timeSlots = new List<TimeSlotDto>();

            var currentTimeUtc = DateTime.UtcNow;
            var currentTimeInUserTz = TimeZoneInfo.ConvertTimeFromUtc(currentTimeUtc, timeZone);

            if (space.IsAllDayBooking && !string.IsNullOrWhiteSpace(space.AllDayStartTime) && !string.IsNullOrWhiteSpace(space.AllDayEndTime))
            {
                if (TimeSpan.TryParse(space.AllDayStartTime, out TimeSpan startTime) &&
                    TimeSpan.TryParse(space.AllDayEndTime, out TimeSpan endTime))
                {
                    var startTimeLocal = selectedDateInUserTz.Date.Add(startTime);
                    var endTimeLocal = selectedDateInUserTz.Date.Add(endTime);

                    var startTimeUtc = TimeZoneInfo.ConvertTimeToUtc(startTimeLocal, timeZone);
                    var endTimeUtc = TimeZoneInfo.ConvertTimeToUtc(endTimeLocal, timeZone);

                    var isPast = endTimeLocal <= currentTimeInUserTz;

                    var isBooked = spaceBookings.Any();

                    timeSlots.Add(new TimeSlotDto
                    {
                        StartTime = space.AllDayStartTime,
                        EndTime = space.AllDayEndTime,
                        IsAvailable = !isBooked && !isPast,
                        IsPast = isPast,
                        IsBooked = isBooked
                    });
                }
            }
            else
            {
                foreach (var hour in space.AvailableHours)
                {
                    if (!TimeSpan.TryParse(hour, out TimeSpan hourTime))
                        continue;

                    var startTimeLocal = selectedDateInUserTz.Date.Add(hourTime);
                    var endTimeLocal = startTimeLocal.AddHours(1);

                    var startTimeUtc = TimeZoneInfo.ConvertTimeToUtc(startTimeLocal, timeZone);
                    var endTimeUtc = TimeZoneInfo.ConvertTimeToUtc(endTimeLocal, timeZone);

                    var isPast = startTimeLocal <= currentTimeInUserTz;

                    var isBooked = spaceBookings.Any(b =>
                        (startTimeUtc >= b.StartDateTime && startTimeUtc < b.EndDateTime) ||
                        (endTimeUtc > b.StartDateTime && endTimeUtc <= b.EndDateTime) ||
                        (startTimeUtc <= b.StartDateTime && endTimeUtc >= b.EndDateTime)
                    );

                    timeSlots.Add(new TimeSlotDto
                    {
                        StartTime = hour,
                        EndTime = endTimeLocal.ToString("HH:mm"),
                        IsAvailable = !isBooked && !isPast,
                        IsPast = isPast,
                        IsBooked = isBooked
                    });
                }
            }

            return Ok(new SpaceAvailabilityDto
            {
                SpaceId = id,
                SpaceName = space.Name,
                Date = selectedDate.ToString("yyyy-MM-dd"),
                IsAllDayBooking = space.IsAllDayBooking,
                TimeSlots = timeSlots
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking availability for space {SpaceId}", id);
            return StatusCode(500, "An error occurred while checking availability.");
        }
    }

    [HttpPost]
    [Authorize(Policy = "OrgAdmin")]
    public async Task<IActionResult> Post([FromForm] SpaceFormRequest request)
    {
        try
        {
            var spaceData = request.SpaceData;
            var image = request.Image;

            var space = JsonSerializer.Deserialize<Space>(spaceData, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (space == null)
            {
                return BadRequest("Invalid space data");
            }

            var imageUrl = await _fileUploadService.SaveImageAsync(image);

            var newSpace = new Space
            {
                Id = Guid.NewGuid().ToString(),
                Name = space.Name,
                Description = space.Description,
                Capacity = space.Capacity,
                ImageUrl = imageUrl,
                CreatedAt = DateTime.UtcNow,
                Resources = space.Resources,
                AvailableHours = space.AvailableHours,
                Availability = space.Availability,
                IsAllDayBooking = space.IsAllDayBooking,
                AllDayStartTime = space.AllDayStartTime,
                AllDayEndTime = space.AllDayEndTime,
            };

            await _spacesService.Create(newSpace);

            newSpace = await _spacesService.GetById(newSpace.Id!);

            if (newSpace == null)
            {
                return NotFound();
            }

            return CreatedAtAction(nameof(Post), new { id = newSpace.Id }, newSpace);
        }
        catch (JsonException)
        {
            // spaceData malformado é erro de quem chamou, não do servidor. Sem isto a
            // JsonException caía no catch genérico e virava 500 — poluindo os logs de
            // erro e escondendo do cliente que o problema era o corpo dele.
            return BadRequest("Invalid space data");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in SpacesController");
            return StatusCode(500, "Internal server error.");
        }
    }

    [HttpPut()]
    [Authorize(Policy = "OrgAdmin")]
    public async Task<IActionResult> Put([FromForm] SpaceFormRequest request)
    {
        try
        {
            var spaceData = request.SpaceData;
            var image = request.Image;

            var space = JsonSerializer.Deserialize<Space>(spaceData, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (space == null || string.IsNullOrWhiteSpace(space.Id))
            {
                return BadRequest("Invalid space data or missing ID");
            }

            var dbSpace = await _spacesService.GetById(space.Id!);

            if (dbSpace == null)
            {
                return NotFound();
            }

            if (image != null)
            {
                var imageUrl = await _fileUploadService.SaveImageAsync(image, dbSpace.ImageUrl);
                dbSpace.ImageUrl = imageUrl;
            }

            dbSpace.Name = space.Name;
            dbSpace.Description = space.Description;
            dbSpace.Capacity = space.Capacity;
            dbSpace.Resources = space.Resources;
            dbSpace.AvailableHours = space.AvailableHours;
            dbSpace.Availability = space.Availability;
            dbSpace.IsAllDayBooking = space.IsAllDayBooking;
            dbSpace.AllDayStartTime = space.AllDayStartTime;
            dbSpace.AllDayEndTime = space.AllDayEndTime;
            dbSpace.UpdatedAt = DateTime.UtcNow;

            await _spacesService.Update(space.Id!, dbSpace);

            dbSpace = await _spacesService.GetById(space.Id!);

            if (dbSpace == null)
            {
                return NotFound();
            }

            return Ok(dbSpace);
        }
        catch (JsonException)
        {
            // spaceData malformado é erro de quem chamou, não do servidor. Sem isto a
            // JsonException caía no catch genérico e virava 500 — poluindo os logs de
            // erro e escondendo do cliente que o problema era o corpo dele.
            return BadRequest("Invalid space data");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in SpacesController");
            return StatusCode(500, "Internal server error.");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "OrgAdmin")]
    public async Task<IActionResult> Delete(string id)
    {
        var space = await _spacesService.GetById(id);

        if (space != null && !string.IsNullOrWhiteSpace(space.ImageUrl))
        {
            await _fileUploadService.DeleteImageAsync(space.ImageUrl);
        }

        await _spacesService.Delete(id);

        return NoContent();
    }
}
