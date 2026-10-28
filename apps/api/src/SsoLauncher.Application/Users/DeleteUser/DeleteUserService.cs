using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Users.DeleteUser;

public sealed class DeleteUserService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader)
{
    public async Task<DeleteUserResult> DeleteAsync(
        long userId,
        long currentUserId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        if (userId == currentUserId)
        {
            return DeleteUserResult.SelfDelete;
        }

        var user = await dbContext.Users
            .SingleOrDefaultAsync(
                x => x.Id == userId,
                cancellationToken
            );

        if (user is null)
        {
            return DeleteUserResult.NotFound;
        }

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var before = await snapshotReader.UserAsync(
            userId,
            cancellationToken
        );

        var now = DateTimeOffset.UtcNow;

        user.DeletedAt = now;
        user.IsActive = false;
        user.UpdatedAt = now;

        var sessions = await dbContext.RefreshTokens
            .Where(x =>
                x.UserId == userId &&
                x.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var session in sessions)
        {
            session.RevokedAt = now;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var after = await snapshotReader.UserAsync(
            userId,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            currentUserId,
            actorName,
            AuditActions.Delete,
            AuditTargets.User,
            userId,
            user.Name,
            before,
            after,
            $"Akun {user.Email} dipindahkan ke tempat sampah",
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return DeleteUserResult.Deleted;
    }
}
