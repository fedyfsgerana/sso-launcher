using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Applications.DeleteApplication;

public sealed class DeleteApplicationService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader)
{
    public async Task<bool> DeleteAsync(
        long applicationId,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        var application = await dbContext.Applications
            .SingleOrDefaultAsync(
                x => x.Id == applicationId,
                cancellationToken
            );

        if (application is null)
        {
            return false;
        }

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var before = await snapshotReader.ApplicationAsync(
            applicationId,
            cancellationToken
        );

        var now = DateTimeOffset.UtcNow;

        application.DeletedAt = now;
        application.IsActive = false;
        application.Status = ApplicationStatuses.Inactive;
        application.UpdatedAt = now;

        await dbContext.SaveChangesAsync(cancellationToken);

        var after = await snapshotReader.ApplicationAsync(
            applicationId,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            actorId,
            actorName,
            AuditActions.Delete,
            AuditTargets.Application,
            applicationId,
            application.Name,
            before,
            after,
            $"Aplikasi dengan slug {application.Slug} dipindahkan ke tempat sampah",
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return true;
    }
}
