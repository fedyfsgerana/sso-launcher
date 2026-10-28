using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Favorites.RemoveFavorite;

public sealed class RemoveFavoriteService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditScope auditScope)
{
    public async Task<bool> RemoveAsync(
        long userId,
        long applicationId,
        CancellationToken cancellationToken = default)
    {
        var favorite = await dbContext.ApplicationFavorites
            .Include(x => x.Application)
            .SingleOrDefaultAsync(
                x =>
                    x.UserId == userId &&
                    x.ApplicationId == applicationId,
                cancellationToken
            );

        if (favorite is null)
        {
            return false;
        }

        dbContext.ApplicationFavorites.Remove(favorite);

        auditLogger.Record(
            userId,
            auditScope.ActorName,
            AuditActions.FavoriteRemove,
            AuditTargets.Favorite,
            applicationId,
            favorite.Application.Name,
            "Aplikasi dihapus dari favorit"
        );

        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}