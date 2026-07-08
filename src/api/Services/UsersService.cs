using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class UsersService
    {
        private readonly AppDbContext _db;

        public UsersService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<User>> GetAsync() =>
            await _db.Users.AsNoTracking().ToListAsync();

        public async Task<User?> GetByIdAsync(string id) =>
            await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);

        // Busca por e-mail é CROSS-TENANT por natureza: o e-mail é globalmente único
        // (índice unique em users.email), e o login precisa achar o usuário antes de
        // conhecer o tenant. Ignora o filtro por tenant de propósito — usada no login e
        // na checagem de e-mail duplicado. (Se um dia o e-mail virar único por tenant,
        // este método precisa ser revisto.)
        public async Task<User?> GetByEmailAsync(string email) =>
            await _db.Users.IgnoreQueryFilters().AsNoTracking().FirstOrDefaultAsync(x => x.Email == email);

        public async Task CreateAsync(User newUser)
        {
            if (string.IsNullOrWhiteSpace(newUser.Id))
                newUser.Id = Guid.NewGuid().ToString();

            _db.Users.Add(newUser);
            await _db.SaveChangesAsync();
        }

        public async Task UpdateAsync(string id, User updatedUser)
        {
            updatedUser.Id = id;
            _db.Users.Update(updatedUser);
            await _db.SaveChangesAsync();
        }

        public async Task RemoveAsync(string id)
        {
            var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == id);
            if (user is null) return;
            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
        }
    }
}
