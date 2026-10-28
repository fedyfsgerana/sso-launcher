using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.RecycleBin;

public sealed class RestoreUserService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader)
{
    public async Task<RestoreResult> RestoreAsync(
        long userId,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(
                x =>
                    x.Id == userId &&
                    x.DeletedAt != null,
                cancellationToken
            );

        if (user is null)
        {
            return RestoreResult.NotFound;
        }

        var conflict = await dbContext.Users
            .AnyAsync(
                x =>
                    x.Email == user.Email ||
                    (user.EmployeeNumber != null &&
                     x.EmployeeNumber == user.EmployeeNumber),
                cancellationToken
            );

        if (conflict)
        {
            return RestoreResult.Conflict;
        }

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var before = await snapshotReader.UserAsync(
            userId,
            cancellationToken
        );

        user.DeletedAt = null;
        user.IsActive = false;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var after = await snapshotReader.UserAsync(
            userId,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            actorId,
            actorName,
            AuditActions.Restore,
            AuditTargets.User,
            userId,
            user.Name,
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