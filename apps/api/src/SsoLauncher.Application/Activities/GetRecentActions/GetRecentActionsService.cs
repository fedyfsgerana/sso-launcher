using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Activities.GetRecentActions;

public sealed class GetRecentActionsService(ISsoLauncherDbContext dbContext)
{
    private const int MaxTake = 50;

    private static readonly string[] Actions =
    [
        AuditActions.Create,
        AuditActions.Update,
        AuditActions.Delete,
        AuditActions.Launch,
        AuditActions.FavoriteAdd
    ];

    public async Task<IReadOnlyList<RecentActionResponse>> GetAsync(
        long userId,
        int take = 10,
        CancellationToken cancellationToken = default)
    {
        var limit = Math.Clamp(take, 1, MaxTake);

        return await dbContext.AuditLogs
            .AsNoTracking()
            .Where(x =>
                x.ActorId == userId &&
                x.Outcome == AuditOutcomes.Success &&
                Actions.Contains(x.Action))
            .OrderByDescending(x => x.OccurredAt)
            .Take(limit)
            .Select(x => new RecentActionResponse(
                x.Id,
                x.Action,
                x.TargetType,
                x.TargetName,
                x.Summary,
                x.OccurredAt
            ))
            .ToListAsync(cancellationToken);
    }
}
