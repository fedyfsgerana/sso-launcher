using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Access;
using SsoLauncher.Application.Audit;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.Favorites.AddFavorite;

public sealed class AddFavoriteService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditScope auditScope)
{
    public async Task<bool> AddAsync(
        long userId,
        long applicationId,
        CancellationToken cancellationToken = default)
    {
        var hasAccess = await EffectiveAccessQueries
            .ApplicationIdsForUser(dbContext, userId)
            .AnyAsync(
                x => x == applicationId,
                cancellationToken
            );

        if (!hasAccess)
        {
            return false;
        }

        var exists = await dbContext.ApplicationFavorites
            .AnyAsync(
                x =>
                    x.UserId == userId &&
                    x.ApplicationId == applicationId,
                cancellationToken
            );

        if (exists)
        {
            return true;
        }

        var applicationName = await dbContext.Applications
            .Where(x => x.Id == applicationId)
            .Select(x => x.Name)
            .SingleOrDefaultAsync(cancellationToken) ?? string.Empty;

        dbContext.ApplicationFavorites.Add(
            new ApplicationFavorite
            {
                UserId = userId,
                ApplicationId = applicationId,
                CreatedAt = DateTimeOffset.UtcNow
            }
        );

        auditLogger.Record(
            userId,
            auditScope.ActorName,
            AuditActions.FavoriteAdd,
            AuditTargets.Favorite,
            applicationId,
            applicationName,
            "Aplikasi ditambahkan ke favorit"
        );

        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}