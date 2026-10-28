#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Audit;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Application.Users;

namespace SsoLauncher.Application.Auth.ChangePassword;

public sealed class ChangePasswordService(
    ISsoLauncherDbContext dbContext,
    IPasswordHasher passwordHasher,
    ISessionTokenService sessionTokenService,
    AuditLogger auditLogger)
{
    public async Task<ChangePasswordResult> ChangeAsync(
        long userId,
        ChangePasswordRequest request,
        string? currentSessionToken,
        CancellationToken cancellationToken = default)
    {
        if (!PasswordRules.IsValid(request.NewPassword))
        {
            return ChangePasswordResult.WeakPassword;
        }

        var user = await dbContext.Users
            .SingleOrDefaultAsync(
                x => x.Id == userId,
                cancellationToken
            );

        if (user is null)
        {
            return ChangePasswordResult.NotFound;
        }

        if (!passwordHasher.Verify(
                request.CurrentPassword,
                user.PasswordHash))
        {
            return ChangePasswordResult.InvalidCurrentPassword;
        }

        var now = DateTimeOffset.UtcNow;

        user.PasswordHash = passwordHasher.Hash(request.NewPassword);
        user.UpdatedAt = now;

        var currentHash = string.IsNullOrEmpty(currentSessionToken)
            ? null
            : sessionTokenService.Hash(currentSessionToken);

        var otherSessions = await dbContext.RefreshTokens
            .Where(x =>
                x.UserId == userId &&
                x.RevokedAt == null &&
                x.ExpiresAt > now &&
                x.TokenHash != currentHash)
            .ToListAsync(cancellationToken);

        foreach (var session in otherSessions)
        {
            session.RevokedAt = now;
        }

        auditLogger.Record(
            userId,
            user.Name,
            AuditActions.Update,
            AuditTargets.Password,
            userId,
            user.Name,
            otherSessions.Count > 0
                ? $"Password diubah sendiri, {otherSessions.Count} sesi lain dicabut"
                : "Password diubah sendiri"
        );

        await dbContext.SaveChangesAsync(cancellationToken);

        return ChangePasswordResult.Changed;
    }
}
