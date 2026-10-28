using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Audit;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Auth.Logout;

public sealed class LogoutService(
    ISsoLauncherDbContext dbContext,
    ISessionTokenService sessionTokenService,
    AuditLogger auditLogger)
{
    public async Task LogoutAsync(
        string sessionToken,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(sessionToken))
        {
            return;
        }

        var tokenHash = sessionTokenService.Hash(sessionToken);

        var refreshToken = await dbContext.RefreshTokens
            .Include(x => x.User)
            .SingleOrDefaultAsync(
                x => x.TokenHash == tokenHash &&
                     x.RevokedAt == null,
                cancellationToken
            );

        if (refreshToken is null)
        {
            return;
        }

        refreshToken.RevokedAt = DateTimeOffset.UtcNow;

        var entry = auditLogger.Record(
            refreshToken.User.Id,
            refreshToken.User.Name,
            AuditActions.Logout,
            AuditTargets.Session,
            refreshToken.User.Id,
            refreshToken.User.Email,
            "Keluar dari portal"
        );

        entry.SessionRef = tokenHash[..16];

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
