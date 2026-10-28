namespace SsoLauncher.Application.Abstractions.Security;

public sealed record SsoTokenValidationResult(
    long UserId,
    long ApplicationId,
    DateTimeOffset ExpiresAt,
    string TokenId
);