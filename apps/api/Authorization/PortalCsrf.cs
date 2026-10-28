using SsoLauncher.Application.Abstractions.Security;

namespace SsoLauncher.Api.Authorization;

public static class PortalCsrf
{
    public const string CookieName = "sso_launcher_csrf";
    public const string HeaderName = "X-CSRF-Token";

    public static bool Validate(
        HttpContext httpContext,
        ICsrfTokenService csrfTokenService)
    {
        httpContext.Request.Cookies.TryGetValue(
            CookieName,
            out var cookieToken
        );

        var headerToken = httpContext.Request.Headers[
            HeaderName
        ].FirstOrDefault();

        return csrfTokenService.Validate(
            cookieToken,
            headerToken
        );
    }
}