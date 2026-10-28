namespace SsoLauncher.Application.Sso.SessionStatus;

public sealed record SsoSessionStatusResponse(
    bool Active,
    string Reason,
    DateTimeOffset? SessionExpiresAt
);
