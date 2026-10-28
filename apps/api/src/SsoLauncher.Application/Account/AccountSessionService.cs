using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Audit;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Account;

public sealed class AccountSessionService(
    ISsoLauncherDbContext dbContext,
    ISessionTokenService sessionTokenService,
    AuditLogger auditLogger)
{
    private const int SessionRefLength = 16;

    public async Task<IReadOnlyList<AccountSessionResponse>> GetAsync(
        long userId,
        string currentSessionToken,
        CancellationToken cancellationToken = default)
    {
        var currentHash = sessionTokenService.Hash(currentSessionToken);
        var now = DateTimeOffset.UtcNow;

        var sessions = await dbContext.RefreshTokens
            .AsNoTracking()
            .Where(x =>
                x.UserId == userId &&
                x.RevokedAt == null &&
                x.ExpiresAt > now)
            .OrderByDescending(x => x.LastSeenAt ?? x.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.TokenHash,
                x.CreatedAt,
                x.LastSeenAt,
                x.ExpiresAt
            })
            .ToListAsync(cancellationToken);

        var refs = sessions
            .Select(x => x.TokenHash[..SessionRefLength])
            .ToList();

        var devices = await dbContext.AuditLogs
            .AsNoTracking()
            .Where(x =>
                x.ActorId == userId &&
                x.Action == AuditActions.Login &&
                x.SessionRef != null &&
                refs.Contains(x.SessionRef))
            .Select(x => new
            {
                x.SessionRef,
                x.Browser,
                x.BrowserVersion,
                x.OperatingSystem,
                x.DeviceName,
                x.IpAddress
            })
            .ToListAsync(cancellationToken);

        var byRef = devices
            .GroupBy(x => x.SessionRef!)
            .ToDictionary(x => x.Key, x => x.First());

        return sessions
            .Select(session =>
            {
                byRef.TryGetValue(session.TokenHash[..SessionRefLength], out var device);

                return new AccountSessionResponse(
                    session.Id,
                    device?.Browser,
                    device?.BrowserVersion,
                    device?.OperatingSystem,
                    device?.DeviceName,
                    device?.IpAddress,
                    session.CreatedAt,
                    session.LastSeenAt ?? session.CreatedAt,
                    session.ExpiresAt,
                    session.TokenHash == currentHash
                );
            })
            .OrderByDescending(x => x.IsCurrent)
            .ThenByDescending(x => x.LastSeenAt)
            .ToList();
    }

    public async Task<bool> RevokeAsync(
        long userId,
        string userName,
        long sessionId,
        string currentSessionToken,
        CancellationToken cancellationToken = default)
    {
        var currentHash = sessionTokenService.Hash(currentSessionToken);

        var session = await dbContext.RefreshTokens
            .SingleOrDefaultAsync(
                x =>
                    x.Id == sessionId &&
                    x.UserId == userId &&
                    x.RevokedAt == null &&
                    x.TokenHash != currentHash,
                cancellationToken
            );

        if (session is null)
        {
            return false;
        }

        session.RevokedAt = DateTimeOffset.UtcNow;

        auditLogger.Record(
            userId,
            userName,
            AuditActions.Logout,
            AuditTargets.Session,
            userId,
            userName,
            "Sesi di perangkat lain dikeluarkan dari halaman Pengaturan"
        ).SessionRef = session.TokenHash[..SessionRefLength];

        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<int> RevokeOthersAsync(
        long userId,
        string userName,
        string currentSessionToken,
        CancellationToken cancellationToken = default)
    {
        var currentHash = sessionTokenService.Hash(currentSessionToken);
        var now = DateTimeOffset.UtcNow;

        var sessions = await dbContext.RefreshTokens
            .Where(x =>
                x.UserId == userId &&
                x.RevokedAt == null &&
                x.ExpiresAt > now &&
                x.TokenHash != currentHash)
            .ToListAsync(cancellationToken);

        if (sessions.Count == 0)
        {
            return 0;
        }

        foreach (var session in sessions)
        {
            session.RevokedAt = now;
        }

        auditLogger.Record(
            userId,
            userName,
            AuditActions.Logout,
            AuditTargets.Session,
            userId,
            userName,
            $"Keluar dari {sessions.Count} perangkat lain dari halaman Pengaturan"
        );

        await dbContext.SaveChangesAsync(cancellationToken);

        return sessions.Count;
    }
}

public sealed record AccountSessionResponse(
    long Id,
    string? Browser,
    string? BrowserVersion,
    string? OperatingSystem,
    string? DeviceName,
    string? IpAddress,
    DateTimeOffset CreatedAt,
    DateTimeOffset LastSeenAt,
    DateTimeOffset ExpiresAt,
    bool IsCurrent
);