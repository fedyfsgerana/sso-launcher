using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Infrastructure.Persistence;

namespace SsoLauncher.Infrastructure.Security;

public sealed class DatabaseSsoTokenReplayGuard(
    SsoLauncherDbContext dbContext) : ISsoTokenReplayGuard
{
    private const int MaxTokenIdLength = 100;

    public async Task<bool> TryConsumeAsync(
        string tokenId,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(tokenId) ||
            tokenId.Length > MaxTokenIdLength)
        {
            return false;
        }

        var usedAt = DateTimeOffset.UtcNow;
        var expiresAtUtc = expiresAt.ToUniversalTime();

        var inserted = await dbContext.Database.ExecuteSqlInterpolatedAsync(
            $"""
            INSERT INTO mgmt_sso_token_uses (token_id, expires_at, used_at)
            VALUES ({tokenId}, {expiresAtUtc}, {usedAt})
            ON CONFLICT (token_id) DO NOTHING
            """,
            cancellationToken
        );

        return inserted == 1;
    }
}
