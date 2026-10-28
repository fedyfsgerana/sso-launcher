using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Activities.GetActivities;

public sealed class GetActivitiesService(
    ISsoLauncherDbContext dbContext)
{
    private const int MaxTake = 100;

    public async Task<IReadOnlyList<ActivityResponse>> GetAsync(
        long userId,
        int take = 20,
        CancellationToken cancellationToken = default)
    {
        var limit = Math.Clamp(take, 1, MaxTake);

        return await dbContext.PortalActivities
            .AsNoTracking()
            .Where(x =>
                x.UserId == userId &&
                x.Kind == PortalActivityKinds.Application)
            .OrderByDescending(x => x.OccurredAt)
            .Take(limit)
            .Select(x => new ActivityResponse(
                x.Id,
                x.Kind,
                x.ApplicationId,
                x.Title,
                x.Subtitle,
                x.TargetPath,
                x.OccurredAt
            ))
            .ToListAsync(cancellationToken);
    }
}
