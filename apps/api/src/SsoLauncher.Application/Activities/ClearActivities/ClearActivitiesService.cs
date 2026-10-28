using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Activities.ClearActivities;

public sealed class ClearActivitiesService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditScope auditScope)
{
    public async Task<int> ClearAsync(
        long userId,
        CancellationToken cancellationToken = default)
    {
        var activities = await dbContext.PortalActivities
            .Where(x => x.UserId == userId)
            .ToListAsync(cancellationToken);

        if (activities.Count == 0)
        {
            return 0;
        }

        foreach (var activity in activities)
        {
            dbContext.PortalActivities.Remove(activity);
        }

        auditLogger.Record(
            userId,
            auditScope.ActorName,
            AuditActions.Delete,
            AuditTargets.Activity,
            null,
            "Riwayat aktivitas",
            $"{activities.Count} riwayat aktivitas pribadi dibersihkan"
        );

        await dbContext.SaveChangesAsync(cancellationToken);

        return activities.Count;
    }
}