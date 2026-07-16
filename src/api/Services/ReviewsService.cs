using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

// Avaliações de espaços dentro da própria API (RF-013), substituindo o antigo
// envio de PII a um Google Form de terceiros.
public class ReviewsService
{
    private readonly AppDbContext _db;

    public ReviewsService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Review> CreateAsync(string userId, CreateReviewRequest request)
    {
        var review = new Review
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            SpaceId = request.SpaceId,
            Rating = request.Rating,
            Comment = request.Comment,
        };

        _db.Reviews.Add(review);
        await _db.SaveChangesAsync();
        return review;
    }

    public async Task<List<Review>> GetBySpaceAsync(string spaceId) =>
        await _db.Reviews.AsNoTracking()
            .Where(r => r.SpaceId == spaceId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
}
