using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Applications.Shared;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Access;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Applications.GetMyApplications;

public sealed class GetMyApplicationsService(
    ISsoLauncherDbContext dbContext)
{
    public async Task<IReadOnlyList<MyApplicationResponse>> GetAsync(
        long userId,
        CancellationToken cancellationToken = default)
    {
        var applicationIds = await EffectiveAccessQueries
            .ApplicationIdsForUser(dbContext, userId)
            .ToListAsync(cancellationToken);

        if (applicationIds.Count == 0)
        {
            return [];
        }

        var applications = await dbContext.Applications
            .AsNoTracking()
            .Where(x =>
                applicationIds.Contains(x.Id) &&
                x.Status != ApplicationStatuses.Inactive)
            .OrderBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Slug,
                x.Description,
                x.AppUrl,
                x.LaunchUrl,
                x.Category,
                x.Icon,
                x.Color,
                x.Status,
                x.MaintenanceMessage,
                x.UsesSso,
                IsFavorite = dbContext.ApplicationFavorites
                    .Any(favorite =>
                        favorite.UserId == userId &&
                        favorite.ApplicationId == x.Id),
                LastOpenedAt = dbContext.PortalActivities
                    .Where(activity =>
                        activity.UserId == userId &&
                        activity.ApplicationId == x.Id)
                    .Max(activity => (DateTimeOffset?)activity.OccurredAt)
            })
            .ToListAsync(cancellationToken);

        return applications
            .Select(x => new MyApplicationResponse(
                x.Id,
                x.Name,
                x.Slug,
                x.Description,
                x.LaunchUrl,
                x.Category,
                x.Icon,
                x.Color,
                x.Status,
                x.MaintenanceMessage,
                x.UsesSso,
                x.IsFavorite,
                x.LastOpenedAt,
                ApplicationUrls.AppUrlOf(x.AppUrl, x.LaunchUrl)
            ))
            .ToList();
    }
}
