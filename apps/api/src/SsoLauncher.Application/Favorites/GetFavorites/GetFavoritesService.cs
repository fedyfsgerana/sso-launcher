using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;

namespace SsoLauncher.Application.Favorites.GetFavorites;

public sealed class GetFavoritesService(
    ISsoLauncherDbContext dbContext)
{
    public async Task<IReadOnlyList<long>> GetAsync(
        long userId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.ApplicationFavorites
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => x.ApplicationId)
            .ToListAsync(cancellationToken);
    }
}