using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.ServiceCredentials.DeleteServiceCredential;

public enum DeleteServiceCredentialOutcome
{
    Deleted,
    NotFound,
    StillActive
}

public sealed class DeleteServiceCredentialService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditScope auditScope)
{
    public async Task<DeleteServiceCredentialOutcome> DeleteAsync(
        long id,
        CancellationToken cancellationToken = default)
    {
        var credential = await dbContext.ApplicationServiceCredentials
            .Include(x => x.Application)
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (credential is null)
        {
            return DeleteServiceCredentialOutcome.NotFound;
        }

        if (credential.IsActive)
        {
            return DeleteServiceCredentialOutcome.StillActive;
        }

        dbContext.ApplicationServiceCredentials.Remove(credential);

        auditLogger.Record(
            auditScope.ActorId,
            auditScope.ActorName,
            AuditActions.Delete,
            AuditTargets.ServiceCredential,
            id,
            $"{credential.Application.Name} - {credential.ClientId}",
            "Kredensial layanan yang sudah dicabut dihapus"
        );

        await dbContext.SaveChangesAsync(cancellationToken);

        return DeleteServiceCredentialOutcome.Deleted;
    }
}
