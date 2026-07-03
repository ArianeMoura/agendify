namespace web.Models;

public class SpaceDto
{
    public string? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Capacity { get; set; }
    public string? ImageUrl { get; set; }
    public List<SpaceResourceDto> Resources { get; set; } = new();
    public List<string> AvailableHours { get; set; } = new();
    public bool Availability { get; set; } = true;

    public bool IsAllDayBooking { get; set; } = false;
    public string? AllDayStartTime { get; set; } = null;
    public string? AllDayEndTime { get; set; } = null;

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class SpaceResourceDto
{
    public string ResourceId { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
}

