using SsoLauncher.Application.Auth.Session;

namespace SsoLauncher.Api.Authorization;

public sealed record AccessAuthorizationResult(
    SessionUser? User,
    bool IsAuthenticated,
    bool IsAuthorized
);