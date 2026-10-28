using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Access;
using SsoLauncher.Application.Audit;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Sso.SignOut;

public sealed class SignOutApplicationService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditScope auditScope)
{
    public async Task<SignOutApplicationResponse?> SignOutAsync(
        long userId,
        string slug,
        CancellationToken cancellationToken = default)
    {
        var normalizedSlug = slug.Trim().ToLowerInvariant();

        if (normalizedSlug.Length == 0)
        {
            return null;
        }

        var application = await dbContext.Applications
            .AsNoTracking()
            .Where(x => x.Slug == normalizedSlug)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Slug
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (application is null)
        {
            return null;
        }

        var hasAccess = await EffectiveAccessQueries
            .ApplicationIdsForUser(dbContext, userId, application.Id)
            .AnyAsync(cancellationToken);

        if (!hasAccess)
        {
            return null;
        }

        auditLogger.Record(
            userId,
            auditScope.ActorName,
            AuditActions.Logout,
            AuditTargets.Application,
            application.Id,
            application.Name,
            "Keluar dari aplikasi, sesi SSO Launcher tetap aktif"
        );

        await dbContext.SaveChangesAsync(cancellationToken);

        return new SignOutApplicationResponse(
            application.Id,
            application.Name,
            application.Slug
        );
    }
}
