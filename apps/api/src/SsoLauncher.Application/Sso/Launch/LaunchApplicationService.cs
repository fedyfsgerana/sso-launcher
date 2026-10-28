using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Access;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.ServiceCredentials;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Sso.Launch;

public sealed class LaunchApplicationService(
    ISsoLauncherDbContext dbContext,
    ISsoTokenService ssoTokenService,
    ISsoTokenLifetimeProvider tokenLifetimeProvider,
    AuditLogger auditLogger,
    AuditScope auditScope)
{
    public async Task<LaunchApplicationResult> LaunchAsync(
        long userId,
        long applicationId,
        CancellationToken cancellationToken = default)
    {
        var application = await dbContext.Applications
            .AsNoTracking()
            .Where(x => x.Id == applicationId)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.LaunchUrl,
                x.Status,
                x.UsesSso
            })
            .SingleOrDefaultAsync(cancellationToken);

        var applicationName =
            application?.Name ?? "Aplikasi tidak dikenal";

        var hasAccess = await EffectiveAccessQueries
            .ApplicationIdsForUser(dbContext, userId)
            .AnyAsync(
                x => x == applicationId,
                cancellationToken
            );

        if (!hasAccess)
        {
            await RecordFailureAsync(
                userId,
                applicationId,
                applicationName,
                "Tidak punya akses",
                cancellationToken
            );

            return LaunchApplicationResult.Unavailable;
        }

        if (application is null ||
            application.Status != ApplicationStatuses.Active)
        {
            await RecordFailureAsync(
                userId,
                applicationId,
                applicationName,
                application is null
                    ? "Aplikasi tidak ditemukan"
                    : $"Status aplikasi {application.Status}",
                cancellationToken
            );

            return LaunchApplicationResult.Unavailable;
        }

        if (!application.UsesSso)
        {
            auditLogger.Record(
                userId,
                auditScope.ActorName,
                AuditActions.Launch,
                AuditTargets.Application,
                application.Id,
                application.Name,
                $"Dibuka lewat portal ke {DescribeHost(application.LaunchUrl)} tanpa SSO"
            );

            await dbContext.SaveChangesAsync(cancellationToken);

            return LaunchApplicationResult.Launched(
                new LaunchApplicationResponse(
                    application.LaunchUrl,
                    null,
                    false
                )
            );
        }

        if (!await HasSsoCredentialAsync(application.Id, cancellationToken))
        {
            await RecordFailureAsync(
                userId,
                applicationId,
                applicationName,
                "Kredensial SSO belum tersedia",
                cancellationToken
            );

            return LaunchApplicationResult.SsoNotReady;
        }

        var expiresAt = DateTimeOffset.UtcNow.Add(
            tokenLifetimeProvider.Lifetime
        );

        var token = ssoTokenService.Generate(
            userId,
            application.Id,
            expiresAt
        );

        var separator = application.LaunchUrl.Contains('?')
            ? '&'
            : '?';

        var launchUrl =
            $"{application.LaunchUrl}{separator}sso_token={Uri.EscapeDataString(token)}";

        auditLogger.Record(
            userId,
            auditScope.ActorName,
            AuditActions.Launch,
            AuditTargets.Application,
            application.Id,
            application.Name,
            $"Dibuka lewat portal ke {DescribeHost(application.LaunchUrl)}"
        );

        await dbContext.SaveChangesAsync(cancellationToken);

        return LaunchApplicationResult.Launched(
            new LaunchApplicationResponse(
                launchUrl,
                expiresAt,
                true
            )
        );
    }

    private async Task<bool> HasSsoCredentialAsync(
        long applicationId,
        CancellationToken cancellationToken)
    {
        var scopes = await dbContext.ApplicationServiceCredentials
            .AsNoTracking()
            .Where(x =>
                x.ApplicationId == applicationId &&
                x.IsActive)
            .Select(x => x.Scope)
            .ToListAsync(cancellationToken);

        return scopes.Any(scope =>
            ServiceScopes.Contains(scope, ServiceScopes.SsoValidate));
    }

    private async Task RecordFailureAsync(
        long userId,
        long applicationId,
        string applicationName,
        string reason,
        CancellationToken cancellationToken)
    {
        auditLogger.Record(
            userId,
            auditScope.ActorName,
            AuditActions.Launch,
            AuditTargets.Application,
            applicationId,
            applicationName,
            $"Gagal membuka aplikasi: {reason}",
            outcome: AuditOutcomes.Failed
        );

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static string DescribeHost(string launchUrl)
    {
        return Uri.TryCreate(launchUrl, UriKind.Absolute, out var uri)
            ? uri.Host
            : launchUrl;
    }
}
