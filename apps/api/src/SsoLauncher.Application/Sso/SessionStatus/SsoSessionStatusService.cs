using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Access;
using SsoLauncher.Application.ServiceCredentials;

namespace SsoLauncher.Application.Sso.SessionStatus;

public sealed class SsoSessionStatusService(
    ISsoLauncherDbContext dbContext,
    ISessionLifetimeProvider sessionLifetimeProvider)
{
    public async Task<SsoSessionStatusResponse> CheckAsync(
        long userId,
        long applicationId,
        string clientId,
        string requiredScope,
        bool keepAlive,
        CancellationToken cancellationToken = default)
    {
        var credential = await dbContext.ApplicationServiceCredentials
            .AsNoTracking()
            .Where(x =>
                x.ApplicationId == applicationId &&
                x.ClientId == clientId &&
                x.IsActive &&
                x.Application.IsActive)
            .Select(x => x.Scope)
            .SingleOrDefaultAsync(cancellationToken);

        if (credential is null ||
            !ServiceScopes.Contains(credential, requiredScope))
        {
            return new SsoSessionStatusResponse(false, "application", null);
        }

        var userActive = await dbContext.Users
            .AsNoTracking()
            .AnyAsync(x => x.Id == userId && x.IsActive, cancellationToken);

        if (!userActive)
        {
            return new SsoSessionStatusResponse(false, "user", null);
        }

        var hasAccess = await EffectiveAccessQueries
            .ApplicationIdsForUser(dbContext, userId, applicationId)
            .AnyAsync(cancellationToken);

        if (!hasAccess)
        {
            return new SsoSessionStatusResponse(false, "access", null);
        }

        var now = DateTimeOffset.UtcNow;
        var idleLimit = now - sessionLifetimeProvider.IdleTimeout;

        var session = await dbContext.RefreshTokens
            .AsNoTracking()
            .Where(x =>
                x.UserId == userId &&
                x.RevokedAt == null &&
                x.ExpiresAt > now &&
                (x.LastSeenAt ?? x.CreatedAt) > idleLimit)
            .OrderByDescending(x => x.LastSeenAt ?? x.CreatedAt)
            .Select(x => new { x.Id, x.ExpiresAt })
            .FirstOrDefaultAsync(cancellationToken);

        if (session is null)
        {
            return new SsoSessionStatusResponse(false, "session", null);
        }

        if (keepAlive)
        {
            await dbContext.RefreshTokens
                .Where(x => x.Id == session.Id)
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(x => x.LastSeenAt, now),
                    cancellationToken
                );
        }

        return new SsoSessionStatusResponse(
            true,
            "active",
            session.ExpiresAt
        );
    }
}
