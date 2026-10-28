namespace SsoLauncher.Application.Abstractions.Security;

public interface ISsoTokenReplayGuard
{
    Task<bool> TryConsumeAsync(
        string tokenId,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken = default);
}
