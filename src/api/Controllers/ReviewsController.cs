using System.Security.Claims;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

// Avaliações de espaços — dentro da API (RF-013), sem Google Form de terceiros.
[ApiController]
[Route("api/reviews")]
[Authorize]
public class ReviewsController : ControllerBase
{
    private readonly ReviewsService _reviewsService;

    public ReviewsController(ReviewsService reviewsService)
    {
        _reviewsService = reviewsService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReviewRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var review = await _reviewsService.CreateAsync(userId, request);
        return CreatedAtAction(nameof(GetBySpace), new { spaceId = review.SpaceId }, review);
    }

    [HttpGet("space/{spaceId}")]
    public async Task<ActionResult<List<Review>>> GetBySpace(string spaceId) =>
        Ok(await _reviewsService.GetBySpaceAsync(spaceId));
}
