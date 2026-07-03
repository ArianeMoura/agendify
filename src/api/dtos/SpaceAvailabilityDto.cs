namespace api.Models
{
    public class SpaceAvailabilityDto
    {
        public string SpaceId { get; set; } = string.Empty;
        public string SpaceName { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public bool IsAllDayBooking { get; set; } = false;
        public List<TimeSlotDto> TimeSlots { get; set; } = new();
    }

    public class TimeSlotDto
    {
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public bool IsAvailable { get; set; } = true;
        public bool IsPast { get; set; } = false;
        public bool IsBooked { get; set; } = false;
    }
}

