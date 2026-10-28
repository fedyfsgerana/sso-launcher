#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Auth.Login;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Application.Notifications;

namespace SsoLauncher.Application.Users.Security;

public sealed class UserSecurityService(
    ISsoLauncherDbContext dbContext,
    Notifier notifier,
    IPasswordHasher passwordHasher,
    LoginLockoutService lockoutService,
    AuditLogger auditLogger)
{
    public async Task<bool> ResetPasswordAsync(
        long userId,
        ResetUserPasswordRequest request,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        if (!PasswordRules.IsValid(request.NewPassword))
        {
            return false;
        }

        var user = await dbContext.Users
            .SingleOrDefaultAsync(
                x => x.Id == userId,
                cancellationToken
            );

        if (user is null)
        {
            return false;
        }

        var now = DateTimeOffset.UtcNow;

        user.PasswordHash = passwordHasher.Hash(request.NewPassword);
        user.UpdatedAt = now;

        notifier.NotifyPasswordReset(user.Id, actorName);

        var revoked = await RevokeAsync(userId, now, cancellationToken);

        auditLogger.Record(
            actorId,
            actorName,
            AuditActions.Update,
            AuditTargets.Password,
            userId,
            user.Name,
            $"Password diatur ulang oleh admin, {revoked} sesi dicabut"
        );

        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<int?> RevokeSessionsAsync(
        long userId,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.Id == userId,
                cancellationToken
            );

        if (user is null)
        {
            return null;
        }

        var revoked = await RevokeAsync(
            userId,
            DateTimeOffset.UtcNow,
            cancellationToken
        );

        auditLogger.Record(
            actorId,
            actorName,
            AuditActions.Revoke,
            AuditTargets.Session,
            userId,
            user.Name,
            $"{revoked} sesi aktif pengguna dicabut"
        );

        await dbContext.SaveChangesAsync(cancellationToken);

        return revoked;
    }

    public async Task<LoginLockStatus?> GetLoginLockAsync(
        long userId,
        CancellationToken cancellationToken = default)
    {
        var email = await dbContext.Users
            .AsNoTracking()
            .Where(x => x.Id == userId)
            .Select(x => x.Email)
            .SingleOrDefaultAsync(cancellationToken);

        if (email is null)
        {
            return null;
        }

        return await lockoutService.GetStatusAsync(
            email,
            DateTimeOffset.UtcNow,
            cancellationToken
        );
    }

    public async Task<int?> UnlockLoginAsync(
        long userId,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.Id == userId,
                cancellationToken
            );

        if (user is null)
        {
            return null;
        }

        var cleared = await lockoutService.ClearAsync(
            user.Email,
            null,
            DateTimeOffset.UtcNow,
            cancellationToken
        );

        auditLogger.Record(
            actorId,
            actorName,
            AuditActions.Unlock,
            AuditTargets.User,
            userId,
            user.Name,
            $"Kunci login dibuka, {cleared} percobaan gagal dihapus dari hitungan"
        );

        await dbContext.SaveChangesAsync(cancellationToken);

        return cleared;
    }

    private async Task<int> RevokeAsync(
        long userId,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var sessions = await dbContext.RefreshTokens
            .Where(x =>
                x.UserId == userId &&
                x.RevokedAt == null &&
                x.ExpiresAt > now)
            .ToListAsync(cancellationToken);

        foreach (var session in sessions)
        {
            session.RevokedAt = now;
        }

        return sessions.Count;
    }
}
