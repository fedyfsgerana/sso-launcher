#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Users;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;
using SsoLauncher.Application.Notifications;

namespace SsoLauncher.Application.Auth.Login;

public sealed class LoginService(
    ISsoLauncherDbContext dbContext,
    IPasswordHasher passwordHasher,
    ISessionTokenService sessionTokenService,
    ISessionLifetimeProvider sessionLifetimeProvider,
    IAuditContextAccessor auditContextAccessor,
    ILoginLockoutPolicy lockoutPolicy,
    LoginLockoutService lockoutService,
    Notifier notifier,
    AuditLogger auditLogger)
{
    public async Task<LoginResult> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        var email = EmailRules.Normalize(request.Email);
        var ipAddress = CurrentAddress();
        var now = DateTimeOffset.UtcNow;

        var user = await dbContext.Users
            .SingleOrDefaultAsync(
                x => x.Email == email,
                cancellationToken
            );

        if (await CheckLockAsync(user, email, ipAddress, now, cancellationToken)
            is { } locked)
        {
            return locked;
        }

        if (user is null)
        {
            passwordHasher.SimulateVerify(request.Password);

            return await RejectAsync(
                null,
                email,
                ipAddress,
                now,
                "Email tidak terdaftar",
                cancellationToken
            );
        }

        if (!passwordHasher.Verify(
                request.Password,
                user.PasswordHash))
        {
            return await RejectAsync(
                user,
                email,
                ipAddress,
                now,
                "Password salah",
                cancellationToken
            );
        }

        if (await RejectUnavailableAsync(user, email, cancellationToken)
            is { } unavailable)
        {
            return unavailable;
        }

        if (passwordHasher.NeedsRehash(user.PasswordHash))
        {
            user.PasswordHash = passwordHasher.Hash(request.Password);
        }

        return await SucceedAsync(
            user,
            email,
            ipAddress,
            now,
            "Berhasil masuk ke portal",
            cancellationToken
        );
    }

    internal string CurrentAddress()
    {
        return LoginLockoutService.NormalizeAddress(
            auditContextAccessor.Current.IpAddress
        );
    }

    internal async Task<LoginResult?> CheckLockAsync(
        User? user,
        string email,
        string ipAddress,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var lockedUntil = await lockoutService.GetLockedUntilAsync(
            email,
            ipAddress,
            now,
            cancellationToken
        );

        if (lockedUntil is null)
        {
            return null;
        }

        RecordFailure(
            user,
            email,
            "Akun sedang dikunci sementara karena terlalu banyak percobaan gagal"
        );

        await dbContext.SaveChangesAsync(cancellationToken);

        return new LoginResult(
            LoginOutcome.LockedOut,
            LockedUntil: lockedUntil
        );
    }

    internal async Task<LoginResult?> RejectUnavailableAsync(
        User user,
        string email,
        CancellationToken cancellationToken)
    {
        if (!user.IsActive)
        {
            RecordFailure(user, email, "Akun nonaktif");

            await dbContext.SaveChangesAsync(cancellationToken);

            return new LoginResult(LoginOutcome.Rejected);
        }

        return null;
    }

    internal async Task<LoginResult> SucceedAsync(
        User user,
        string email,
        string ipAddress,
        DateTimeOffset now,
        string summary,
        CancellationToken cancellationToken)
    {
        await lockoutService.ClearAsync(
            email,
            ipAddress,
            now,
            cancellationToken
        );

        var sessionToken =
            sessionTokenService.Generate();

        var tokenHash =
            sessionTokenService.Hash(sessionToken);

        var expiresAt =
            now.Add(sessionLifetimeProvider.Lifetime);

        dbContext.RefreshTokens.Add(
            new RefreshToken
            {
                UserId = user.Id,
                TokenHash = tokenHash,
                ExpiresAt = expiresAt,
                RevokedAt = null,
                CreatedAt = now,
                LastSeenAt = now
            }
        );

        await NotifyIfNewDeviceAsync(user.Id, cancellationToken);

        var entry = auditLogger.Record(
            user.Id,
            user.Name,
            AuditActions.Login,
            AuditTargets.Session,
            user.Id,
            user.Email,
            summary
        );

        entry.SessionRef = tokenHash[..16];

        await dbContext.SaveChangesAsync(
            cancellationToken
        );

        return new LoginResult(
            LoginOutcome.Succeeded,
            new LoginResponse(
                user.Id,
                user.Name,
                user.Email,
                user.Department,
                user.DepartemenCode,
                user.JobTitle,
                expiresAt
            ),
            sessionToken
        );
    }

    internal async Task<LoginResult> RejectAsync(
        User? user,
        string email,
        string ipAddress,
        DateTimeOffset now,
        string reason,
        CancellationToken cancellationToken)
    {
        RecordFailure(user, email, reason);

        var lockedUntil = await lockoutService.RegisterFailureAsync(
            email,
            ipAddress,
            now,
            cancellationToken
        );

        if (lockedUntil is not null)
        {
            auditLogger.Record(
                user?.Id,
                user?.Name ?? "Sistem",
                AuditActions.Lock,
                AuditTargets.Session,
                user?.Id,
                string.IsNullOrWhiteSpace(email) ? "(kosong)" : email,
                $"Login dikunci sementara {(int)lockoutPolicy.Window.TotalMinutes} menit setelah terlalu banyak percobaan gagal",
                outcome: AuditOutcomes.Failed
            );

            await notifier.NotifyAccountLockedAsync(
                user?.Id,
                string.IsNullOrWhiteSpace(email) ? "(kosong)" : email,
                ipAddress,
                cancellationToken
            );
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return new LoginResult(LoginOutcome.Rejected);
    }

    private void RecordFailure(
        User? user,
        string email,
        string reason)
    {
        auditLogger.Record(
            user?.Id,
            user?.Name ?? "Tidak dikenal",
            AuditActions.LoginFailed,
            AuditTargets.Session,
            user?.Id,
            string.IsNullOrWhiteSpace(email) ? "(kosong)" : email,
            $"Login gagal: {reason}",
            outcome: AuditOutcomes.Failed
        );
    }

    private async Task NotifyIfNewDeviceAsync(
        long userId,
        CancellationToken cancellationToken)
    {
        var context = auditContextAccessor.Current;

        var previousLogins = dbContext.AuditLogs
            .AsNoTracking()
            .Where(x =>
                x.ActorId == userId &&
                x.Action == AuditActions.Login &&
                x.Outcome == AuditOutcomes.Success);

        if (!await previousLogins.AnyAsync(cancellationToken))
        {
            return;
        }

        var knownDevice = await previousLogins.AnyAsync(
            x =>
                x.Browser == context.Browser &&
                x.OperatingSystem == context.OperatingSystem &&
                x.DeviceName == context.DeviceName,
            cancellationToken
        );

        if (knownDevice)
        {
            return;
        }

        var device = string.Join(
            " - ",
            new[] { context.Browser, context.OperatingSystem, context.DeviceName }
                .Where(x => !string.IsNullOrWhiteSpace(x))
        );

        notifier.NotifyNewDevice(
            userId,
            string.IsNullOrWhiteSpace(device) ? "perangkat yang tidak dikenal" : device
        );
    }
}
