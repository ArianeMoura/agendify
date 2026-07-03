using System.ComponentModel.DataAnnotations;

namespace api.Models;

public class UpdateUserRequest
{
    public string? Name { get; set; }

    [EmailAddress]
    public string? Email { get; set; }

    [MinLength(6)]
    public string? Password { get; set; }

    public Profile? Profile { get; set; }
}
