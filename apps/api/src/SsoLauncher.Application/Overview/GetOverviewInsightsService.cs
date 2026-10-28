using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Overview;

public sealed class GetOverviewInsightsService(
    ISsoLauncherDbContext dbContext,
    ILoginLockoutPolicy lockoutPolicy)
{
    private static readonly TimeSpan FailedLoginWindow = TimeSpan.FromHours(24);
    private static readonly TimeSpan OpenedWindow = TimeSpan.FromDays(7);

    public async Task<OverviewInsightsResponse> GetAsync(
        long userId,
        string? currentSessionRef,
        bool includeLockedAccounts,
        bool includeFailedLogins,
        CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;

        var lastLogin = await dbContext.AuditLogs
            .AsNoTracking()
            .Where(x =>
                x.ActorId == userId &&
                x.Action == AuditActions.Login &&
                x.Outcome == AuditOutcomes.Success &&
                (currentSessionRef == null || x.SessionRef != currentSessionRef))
            .OrderByDescending(x => x.OccurredAt)
            .Select(x => new LastLoginResponse(
                x.OccurredAt,
                x.IpAddress,
                x.Browser,
                x.BrowserVersion,
                x.OperatingSystem,
                x.DeviceType,
                x.DeviceName
            ))
            .FirstOrDefaultAsync(cancellationToken);

        int? lockedAccounts = includeLockedAccounts
            ? await CountLockedAccountsAsync(now, cancellationToken)
            : null;

        int? failedLogins = null;

        if (includeFailedLogins)
        {
            var since = now.Subtract(FailedLoginWindow);

            failedLogins = await dbContext.AuditLogs
                .AsNoTracking()
                .CountAsync(
                    x =>
                        x.Action == AuditActions.LoginFailed &&
                        x.OccurredAt >= since,
                    cancellationToken
                );
        }

        var openedSince = now.Subtract(OpenedWindow);
        var openedLastWeek = await dbContext.AuditLogs
            .AsNoTracking()
            .CountAsync(
                x =>
                    x.ActorId == userId &&
                    x.Action == AuditActions.Launch &&
                    x.Outcome == AuditOutcomes.Success &&
                    x.OccurredAt >= openedSince,
                cancellationToken
            );

        return new OverviewInsightsResponse(
            lastLogin,
            lockedAccounts,
            failedLogins,
            openedLastWeek
        );
    }

    private async Task<int> CountLockedAccountsAsync(
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var since = now.Subtract(lockoutPolicy.Window);

        var failures = await dbContext.LoginFailures
            .AsNoTracking()
            .Where(x =>
                x.ClearedAt == null &&
                x.OccurredAt > since &&
                dbContext.Users.Any(user => user.Email == x.Email))
            .Select(x => new { x.Email, x.IpAddress })
            .ToListAsync(cancellationToken);

        return failures
            .GroupBy(x => x.Email)
            .Count(account =>
                account.Count() >= lockoutPolicy.MaxFailuresPerAccount ||
                account
                    .GroupBy(x => x.IpAddress)
                    .Any(address => address.Count() >= lockoutPolicy.MaxFailuresPerAddress));
    }
}
