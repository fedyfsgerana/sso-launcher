using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.RecycleBin;

public sealed class RestoreApplicationService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader)
{
    public async Task<RestoreResult> RestoreAsync(
        long applicationId,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        var application = await dbContext.Applications
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(
                x =>
                    x.Id == applicationId &&
                    x.DeletedAt != null,
                cancellationToken
            );

        if (application is null)
        {
            return RestoreResult.NotFound;
        }

        var conflict = await dbContext.Applications
            .AnyAsync(
                x => x.Slug == application.Slug,
                cancellationToken
            );

        if (conflict)
        {
            return RestoreResult.Conflict;
        }

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var before = await snapshotReader.ApplicationAsync(
            applicationId,
            cancellationToken
        );

        application.DeletedAt = null;
        application.IsActive = false;
        application.Status = ApplicationStatuses.Inactive;
        application.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var after = await snapshotReader.ApplicationAsync(
            applicationId,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            actorId,
            actorName,
            AuditActions.Restore,
            AuditTargets.Application,
            applicationId,
            application.Name,
            before,
            after,
            "Dipulihkan dalam keadaan nonaktif",
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return RestoreResult.Restored;
    }
}