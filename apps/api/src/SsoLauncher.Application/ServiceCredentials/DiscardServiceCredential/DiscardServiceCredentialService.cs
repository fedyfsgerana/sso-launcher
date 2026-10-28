using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.ServiceCredentials.DiscardServiceCredential;

public enum DiscardServiceCredentialOutcome
{
    Discarded,
    NotFound,
    TooLate
}

public sealed class DiscardServiceCredentialService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditScope auditScope)
{
    public static readonly TimeSpan Window = TimeSpan.FromHours(1);

    public async Task<DiscardServiceCredentialOutcome> DiscardAsync(
        long id,
        CancellationToken cancellationToken = default)
    {
        var credential = await dbContext.ApplicationServiceCredentials
            .Include(x => x.Application)
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (credential is null)
        {
            return DiscardServiceCredentialOutcome.NotFound;
        }

        if (credential.LastUsedAt is not null ||
            DateTimeOffset.UtcNow - credential.CreatedAt > Window)
        {
            return DiscardServiceCredentialOutcome.TooLate;
        }

        credential.IsActive = false;
        credential.UpdatedAt = DateTimeOffset.UtcNow;
        credential.DeleteReason = "Dibatalkan sebelum disimpan";
        dbContext.ApplicationServiceCredentials.Remove(credential);

        auditLogger.Record(
            auditScope.ActorId,
            auditScope.ActorName,
            AuditActions.Delete,
            AuditTargets.ServiceCredential,
            credential.Id,
            $"{credential.Application.Name} - {credential.ClientId}",
            "Kredensial dibatalkan sebelum disimpan",
            "Dibatalkan sebelum disimpan"
        );

        await dbContext.SaveChangesAsync(cancellationToken);

        return DiscardServiceCredentialOutcome.Discarded;
    }
}
