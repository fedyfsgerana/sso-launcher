using SsoLauncher.Application.Auth.Session;

namespace SsoLauncher.Api.Authorization;

public static class PortalAuthorization
{
    public const string SessionCookieName =
        "sso_launcher_session";

    public static async Task<SessionUser?> GetSessionUserAsync(
        HttpContext httpContext,
        SessionService sessionService,
        CancellationToken cancellationToken = default)
    {
        if (!httpContext.Request.Cookies.TryGetValue(
                SessionCookieName,
                out var sessionToken) ||
            string.IsNullOrWhiteSpace(sessionToken))
        {
            return null;
        }

        return await sessionService.GetUserAsync(
            sessionToken,
            cancellationToken
        );
    }

    public static async Task<AccessAuthorizationResult> AuthorizeMenuAsync(
        HttpContext httpContext,
        SessionService sessionService,
        string menuTarget,
        CancellationToken cancellationToken = default)
    {
        var user =
            await GetSessionUserAsync(
                httpContext,
                sessionService,
                cancellationToken
            );

        if (user is null)
        {
            return new AccessAuthorizationResult(
                null,
                false,
                false
            );
        }

        var allowed =
            await sessionService.HasMenuAccessAsync(
                user.UserId,
                menuTarget,
                cancellationToken
            );

        return new AccessAuthorizationResult(
            user,
            true,
            allowed
        );
    }

    public static async Task<AccessAuthorizationResult> AuthorizeActionAsync(
        HttpContext httpContext,
        SessionService sessionService,
        string menuTarget,
        string actionKey,
        CancellationToken cancellationToken = default)
    {
        var authorization = await AuthorizeMenuAsync(
            httpContext,
            sessionService,
            menuTarget,
            cancellationToken
        );

        if (!authorization.IsAuthenticated || !authorization.IsAuthorized)
        {
            return authorization;
        }

        var allowed = await sessionService.HasMenuActionAsync(
            authorization.User!.UserId,
            menuTarget,
            actionKey,
            cancellationToken
        );

        return authorization with { IsAuthorized = allowed };
    }
}
