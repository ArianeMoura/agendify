using System.ComponentModel.DataAnnotations;

namespace api.Models;

public class RefreshRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}

public class ConsentRequest
{
    [Required]
    public string Version { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;

    // Mesma política do aceite de convite (AcceptInvitationRequest).
    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;
}

public class CreateReviewRequest
{
    [Required]
    public string SpaceId { get; set; } = string.Empty;

    [Range(1, 5)]
    public int Rating { get; set; }

    public string? Comment { get; set; }
}
