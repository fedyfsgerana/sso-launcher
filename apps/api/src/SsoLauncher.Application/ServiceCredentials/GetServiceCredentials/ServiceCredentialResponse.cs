namespace SsoLauncher.Application.ServiceCredentials.GetServiceCredentials;

public sealed record ServiceCredentialResponse(
    long Id,
    long ApplicationId,
    string ApplicationName,
    string ClientId,
    string Scope,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? LastUsedAt,
    DateTimeOffset? GuideDownloadedAt = null
);
