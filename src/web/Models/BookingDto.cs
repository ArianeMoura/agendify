namespace web.Models;

public class BookingDto
{
    public string? Id { get; set; }
    public string? UserId { get; set; }
    public string? SpaceId { get; set; }
    public DateTime StartDateTime { get; set; } = DateTime.UtcNow;
    public DateTime EndDateTime { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public UserDto? User { get; set; }
    public SpaceDto? Space { get; set; }
}

public class CreateBookingRequest
{
    public string? UserId { get; set; }
    public string? SpaceId { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
}

