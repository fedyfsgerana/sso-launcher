using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Audit;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Auth.Session;

public sealed class SessionService(
    ISsoLauncherDbContext dbContext,
    ISessionTokenService sessionTokenService,
    ISessionLifetimeProvider sessionLifetimeProvider,
    AuditScope auditScope,
    AuditLogger auditLogger)
{
    private static readonly TimeSpan LastSeenInterval = TimeSpan.FromMinutes(1);

    public async Task<SessionUser?> GetUserAsync(
        string sessionToken,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(sessionToken))
        {
            return null;
        }

        var tokenHash =
            sessionTokenService.Hash(sessionToken);

        var now =
            DateTimeOffset.UtcNow;

        var session = await dbContext.RefreshTokens
            .AsNoTracking()
            .Include(x => x.User)
            .SingleOrDefaultAsync(
                x =>
                    x.TokenHash == tokenHash &&
                    x.RevokedAt == null &&
                    x.ExpiresAt > now &&
                    x.User.IsActive,
                cancellationToken
            );

        if (session is null)
        {
            return null;
        }

        var lastSeenAt = session.LastSeenAt ?? session.CreatedAt;
        var idleTimeout = sessionLifetimeProvider.IdleTimeout;

        if (now - lastSeenAt >= idleTimeout)
        {
            await ExpireIdleSessionAsync(
                session.Id,
                session.User.Id,
                session.User.Name,
                session.User.Email,
                tokenHash,
                now,
                idleTimeout,
                cancellationToken
            );

            return null;
        }

        if (now - lastSeenAt >= LastSeenInterval)
        {
            await dbContext.RefreshTokens
                .Where(x => x.Id == session.Id)
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(x => x.LastSeenAt, now),
                    cancellationToken
                );
        }

        auditScope.SetActor(
            session.User.Id,
            session.User.Name
        );

        return new SessionUser(
            session.User.Id,
            session.User.Name,
            session.User.Email,
            session.User.Department,
            session.User.DepartemenCode,
            session.User.JobTitle,
            session.ExpiresAt
        );
    }

    public async Task<bool> HasMenuAccessAsync(
        long userId,
        string targetValue,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.UserGroupMenuAccesses
            .AsNoTracking()
            .AnyAsync(
                x =>
                    x.PortalMenu.IsActive &&
                    x.PortalMenu.TargetValue == targetValue &&
                    x.UserGroup.IsActive &&
                    x.UserGroup.Members.Any(member => member.UserId == userId),
                cancellationToken
            );
    }

    public async Task<bool> HasMenuActionAsync(
        long userId,
        string targetValue,
        string actionKey,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.UserGroupMenuActions
            .AsNoTracking()
            .AnyAsync(
                x =>
                    x.ActionKey == actionKey &&
                    x.PortalMenu.IsActive &&
                    x.PortalMenu.TargetValue == targetValue &&
                    x.UserGroup.IsActive &&
                    x.UserGroup.Members.Any(member => member.UserId == userId),
                cancellationToken
            );
    }

    private async Task ExpireIdleSessionAsync(
        long sessionId,
        long userId,
        string userName,
        string email,
        string tokenHash,
        DateTimeOffset now,
        TimeSpan idleTimeout,
        CancellationToken cancellationToken)
    {
        var revoked = await dbContext.RefreshTokens
            .Where(x => x.Id == sessionId && x.RevokedAt == null)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(x => x.RevokedAt, now),
                cancellationToken
            );

        if (revoked == 0)
        {
            return;
        }

        var entry = auditLogger.Record(
            userId,
            userName,
            AuditActions.Logout,
            AuditTargets.Session,
            userId,
            email,
            $"Sesi berakhir otomatis karena tidak aktif {(int)idleTimeout.TotalMinutes} menit"
        );

        entry.SessionRef = tokenHash[..16];

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
