namespace api.Models;

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public Profile Profile { get; set; }
    public DateTime CreatedAt { get; set; }
}
