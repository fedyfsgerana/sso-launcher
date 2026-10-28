namespace SsoLauncher.Application.Sso.Launch;

public sealed record LaunchApplicationResponse(
    string LaunchUrl,
    DateTimeOffset? ExpiresAt,
    bool UsesSso
);
