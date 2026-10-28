using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Activities.DeleteActivity;

public sealed class DeleteActivityService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditScope auditScope)
{
    public async Task<bool> DeleteAsync(
        long userId,
        long activityId,
        CancellationToken cancellationToken = default)
    {
        var activity = await dbContext.PortalActivities
            .SingleOrDefaultAsync(
                x =>
                    x.Id == activityId &&
                    x.UserId == userId,
                cancellationToken
            );

        if (activity is null)
        {
            return false;
        }

        dbContext.PortalActivities.Remove(activity);

        auditLogger.Record(
            userId,
            auditScope.ActorName,
            AuditActions.Delete,
            AuditTargets.Activity,
            activityId,
            activity.Title,
            "Riwayat aktivitas pribadi dihapus"
        );

        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}