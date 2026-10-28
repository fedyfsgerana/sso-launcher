using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.ServiceCredentials.RevokeServiceCredential;

public sealed class RevokeServiceCredentialService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader,
    AuditScope auditScope)
{
    public async Task<bool> RevokeAsync(
        long id,
        CancellationToken cancellationToken = default)
    {
        var credential =
            await dbContext.ApplicationServiceCredentials
                .Include(x => x.Application)
                .SingleOrDefaultAsync(
                    x => x.Id == id,
                    cancellationToken
                );

        if (credential is null)
        {
            return false;
        }

        if (!credential.IsActive)
        {
            return true;
        }

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var before = await snapshotReader.ServiceCredentialAsync(
            id,
            cancellationToken
        );

        credential.IsActive = false;
        credential.UpdatedAt =
            DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(
            cancellationToken
        );

        var after = await snapshotReader.ServiceCredentialAsync(
            id,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            auditScope.ActorId,
            auditScope.ActorName,
            AuditActions.Revoke,
            AuditTargets.ServiceCredential,
            id,
            $"{credential.Application.Name} - {credential.ClientId}",
            before,
            after,
            "Kredensial layanan dicabut",
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return true;
    }
}