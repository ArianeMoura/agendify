using api.Models;
using MongoDB.Driver;
using Microsoft.Extensions.Options;
using MongoDB.Bson;

namespace api.Services
{
    public class BookingsService
    {
        private readonly IMongoCollection<Booking> _bookingsCollection;
        private readonly IMongoCollection<User> _usersCollection;
        private readonly IMongoCollection<Space> _spacesCollection;

        public BookingsService(IMongoDatabase database, IOptions<DatabaseSettings> databaseSettings)
        {
            var settings = databaseSettings.Value;
            _bookingsCollection = database.GetCollection<Booking>(settings.BookingsCollectionName);
            _usersCollection = database.GetCollection<User>(settings.UsersCollectionName);
            _spacesCollection = database.GetCollection<Space>(settings.SpacesCollectionName);
        }

        public async Task<BookingWithUserAndSpace> GetById(string id)
        {
            var booking = await _bookingsCollection.Find(x => x.Id == id).FirstOrDefaultAsync();
            var user = await _usersCollection.Find(x => x.Id == booking.UserId).FirstOrDefaultAsync();
            var space = await _spacesCollection.Find(x => x.Id == booking.SpaceId).FirstOrDefaultAsync();

            var bookingWithUserAndSpace = new BookingWithUserAndSpace
            {
                User = user,
                Space = space,
                Id = booking.Id,
                UserId = booking.UserId,
                SpaceId = booking.SpaceId,
                StartDateTime = booking.StartDateTime,
                EndDateTime = booking.EndDateTime,
                CreatedAt = booking.CreatedAt,
                UpdatedAt = booking.UpdatedAt,
            };

            return bookingWithUserAndSpace;
        }

        public async Task<List<BookingWithUserAndSpace>> GetByUserId(string userId)
        {
            var bookings = await _bookingsCollection.Find(x => x.UserId == userId).ToListAsync();

            var userIds = bookings.Select(b => b.UserId).Where(id => id != null).Distinct().ToList();
            var spaceIds = bookings.Select(b => b.SpaceId).Where(id => id != null).Distinct().ToList();

            var users = await _usersCollection.Find(x => userIds.Contains(x.Id)).ToListAsync();
            var spaces = await _spacesCollection.Find(x => spaceIds.Contains(x.Id)).ToListAsync();

            var bookingsWithUserAndSpace = bookings.Select(b => new BookingWithUserAndSpace
            {
                User = users.FirstOrDefault(x => x.Id == b.UserId),
                Space = spaces.FirstOrDefault(x => x.Id == b.SpaceId),
                Id = b.Id,
                UserId = b.UserId,
                SpaceId = b.SpaceId,
                StartDateTime = b.StartDateTime,
                EndDateTime = b.EndDateTime,
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt,
            }).ToList();

            return bookingsWithUserAndSpace;
        }

        public async Task<List<BookingWithUserAndSpace>> GetAsync()
        {
            var bookings = await _bookingsCollection.Find(_ => true).ToListAsync();

            var userIds = bookings.Select(b => b.UserId).Where(id => id != null).Distinct().ToList();
            var spaceIds = bookings.Select(b => b.SpaceId).Where(id => id != null).Distinct().ToList();

            var users = await _usersCollection.Find(x => userIds.Contains(x.Id)).ToListAsync();
            var spaces = await _spacesCollection.Find(x => spaceIds.Contains(x.Id)).ToListAsync();

            var bookingsWithUserAndSpace = bookings.Select(b => new BookingWithUserAndSpace
            {
                User = users.FirstOrDefault(x => x.Id == b.UserId),
                Space = spaces.FirstOrDefault(x => x.Id == b.SpaceId),
                Id = b.Id,
                UserId = b.UserId,
                SpaceId = b.SpaceId,
                StartDateTime = b.StartDateTime,
                EndDateTime = b.EndDateTime,
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt,
            }).ToList();

            return bookingsWithUserAndSpace;
        }

        public async Task<bool> IsSpaceAvailable(Booking booking)
        {
            var space = await _spacesCollection.Find(x => x.Id == booking.SpaceId).FirstOrDefaultAsync() ?? throw new InvalidOperationException($"O espaço com ID {booking.SpaceId} não foi encontrado.");

            if (!space.Availability)
            {
                throw new InvalidOperationException($"O espaço '{space.Name}' não está disponível para reservas no momento.");
            }

            if (booking.StartDateTime >= booking.EndDateTime)
            {
                throw new InvalidOperationException("A data de início deve ser anterior à data de término.");
            }


            if (space.IsAllDayBooking)
            {
                if (booking.EndDateTime <= DateTime.UtcNow)
                {
                    throw new InvalidOperationException("Não é possível fazer reservas para dias cujo horário de término já passou.");
                }
            }
            else
            {
                if (booking.StartDateTime <= DateTime.UtcNow)
                {
                    throw new InvalidOperationException("Não é possível fazer reservas em horários passados ou no horário atual.");
                }
            }

            var existingBookings = await _bookingsCollection
                .Find(x => x.SpaceId == booking.SpaceId)
                .ToListAsync();

            var hasConflict = existingBookings.Any(existing =>
                booking.StartDateTime < existing.EndDateTime &&
                booking.EndDateTime > existing.StartDateTime
            );

            return !hasConflict;
        }

        public async Task Create(Booking booking)
        {
            if (string.IsNullOrWhiteSpace(booking.Id))
            {
                booking.Id = ObjectId.GenerateNewId().ToString();
            }

            var isAvailable = await IsSpaceAvailable(booking);

            if (!isAvailable)
            {
                throw new InvalidOperationException(
                    $"O espaço '{booking.SpaceId}' já está reservado no horário solicitado. " +
                    $"Por favor, escolha outro horário."
                );
            }

            await _bookingsCollection.InsertOneAsync(booking);
        }

        public async Task Update(string id, Booking booking)
        {
            await _bookingsCollection.ReplaceOneAsync(x => x.Id == id, booking);
        }

        public async Task Delete(string id)
        {
            await _bookingsCollection.DeleteOneAsync(x => x.Id == id);
        }
    }
}