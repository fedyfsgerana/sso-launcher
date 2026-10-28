using Microsoft.AspNetCore.RateLimiting;
using SsoLauncher.Api.Authorization;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Auth.ChangePassword;
using SsoLauncher.Application.Auth.Login;
using SsoLauncher.Application.Auth.Logout;
using SsoLauncher.Application.Auth.Session;

namespace SsoLauncher.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints
            .MapGroup("/api/auth")
            .WithTags("Auth");

        group.MapPost("/login", LoginAsync)
            .WithName("Login")
            .WithSummary("Sign in to SSO Launcher")
            .WithDescription(
                "Authenticates a portal user and creates the browser session and CSRF cookies."
            )
            .Produces<LoginResponse>(
                StatusCodes.Status200OK
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            )
            .Produces(
                StatusCodes.Status429TooManyRequests
            )
            .RequireRateLimiting("Login");

        group.MapPost("/logout", LogoutAsync)
            .WithName("Logout")
            .WithSummary("Sign out from SSO Launcher")
            .WithDescription(
                "Revokes the current browser session and removes the session and CSRF cookies."
            )
            .Produces(
                StatusCodes.Status204NoContent
            )
            .Produces(
                StatusCodes.Status403Forbidden
            );

        group.MapGet("/session", GetSessionAsync)
            .WithName("GetSession")
            .WithSummary("Get the current portal session")
            .WithDescription(
                "Returns the authenticated portal user and current session state."
            )
            .Produces<SessionResponse>(
                StatusCodes.Status200OK
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            );

        group.MapPost("/change-password", ChangePasswordAsync)
            .WithName("ChangePassword")
            .WithSummary("Change the current user password")
            .WithDescription(
                "Changes the password of the authenticated user. Requires the current password and a valid CSRF token."
            )
            .Produces(
                StatusCodes.Status204NoContent
            )
            .Produces(
                StatusCodes.Status400BadRequest
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            )
            .Produces(
                StatusCodes.Status403Forbidden
            );

        return endpoints;
    }

    private static async Task<IResult> ChangePasswordAsync(
        ChangePasswordRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        ChangePasswordService changePasswordService,
        CancellationToken cancellationToken)
    {
        var user =
            await PortalAuthorization.GetSessionUserAsync(
                httpContext,
                sessionService,
                cancellationToken
            );

        if (user is null)
        {
            return Results.Unauthorized();
        }

        if (!PortalCsrf.Validate(
                httpContext,
                csrfTokenService))
        {
            return Results.StatusCode(
                StatusCodes.Status403Forbidden
            );
        }

        var result =
            await changePasswordService.ChangeAsync(
                user.UserId,
                request,
                httpContext.Request.Cookies[
                    PortalAuthorization.SessionCookieName
                ],
                cancellationToken
            );

        return result switch
        {
            ChangePasswordResult.Changed => Results.NoContent(),
            ChangePasswordResult.NotFound => Results.Unauthorized(),
            _ => Results.BadRequest(
                new { error = result.ToString() }
            )
        };
    }

    private static async Task<IResult> LoginAsync(
        LoginRequest request,
        HttpContext httpContext,
        LoginService loginService,
        ICsrfTokenService csrfTokenService,
        IWebHostEnvironment environment,
        CancellationToken cancellationToken)
    {
        SetNoStoreHeaders(httpContext);

        var result =
            await loginService.LoginAsync(
                request,
                cancellationToken
            );

        return CompleteLogin(httpContext, result, csrfTokenService, environment);
    }

    private static IResult CompleteLogin(
        HttpContext httpContext,
        LoginResult result,
        ICsrfTokenService csrfTokenService,
        IWebHostEnvironment environment)
    {
        if (result.Outcome == LoginOutcome.LockedOut)
        {
            var retryAfter = Math.Max(
                1,
                (int)Math.Ceiling(
                    ((result.LockedUntil ?? DateTimeOffset.UtcNow) -
                        DateTimeOffset.UtcNow).TotalSeconds
                )
            );

            httpContext.Response.Headers.RetryAfter =
                retryAfter.ToString(System.Globalization.CultureInfo.InvariantCulture);

            return Results.Json(
                new LoginLockedResponse("login_locked", retryAfter),
                statusCode: StatusCodes.Status429TooManyRequests
            );
        }

        if (result.Outcome != LoginOutcome.Succeeded ||
            result.Response is null ||
            result.SessionToken is null)
        {
            return Results.Unauthorized();
        }

        var secure =
            !environment.IsDevelopment();

        var expiresAt =
            result.Response.ExpiresAt;

        httpContext.Response.Cookies.Append(
            PortalAuthorization.SessionCookieName,
            result.SessionToken,
            CreateSessionCookieOptions(
                secure,
                expiresAt
            )
        );

        var csrfToken =
            csrfTokenService.Generate();

        httpContext.Response.Cookies.Append(
            PortalCsrf.CookieName,
            csrfToken,
            CreateCsrfCookieOptions(
                secure,
                expiresAt
            )
        );

        return Results.Ok(
            result.Response
        );
    }

    private static async Task<IResult> LogoutAsync(
        HttpContext httpContext,
        LogoutService logoutService,
        ICsrfTokenService csrfTokenService,
        IWebHostEnvironment environment,
        CancellationToken cancellationToken)
    {
        SetNoStoreHeaders(httpContext);

        if (!PortalCsrf.Validate(
                httpContext,
                csrfTokenService))
        {
            return Results.StatusCode(
                StatusCodes.Status403Forbidden
            );
        }

        httpContext.Request.Cookies.TryGetValue(
            PortalAuthorization.SessionCookieName,
            out var sessionToken
        );

        if (!string.IsNullOrWhiteSpace(
                sessionToken))
        {
            await logoutService.LogoutAsync(
                sessionToken,
                cancellationToken
            );
        }

        var secure =
            !environment.IsDevelopment();

        httpContext.Response.Cookies.Delete(
            PortalAuthorization.SessionCookieName,
            CreateSessionDeleteCookieOptions(
                secure
            )
        );

        httpContext.Response.Cookies.Delete(
            PortalCsrf.CookieName,
            CreateCsrfDeleteCookieOptions(
                secure
            )
        );

        return Results.NoContent();
    }

    private static async Task<IResult> GetSessionAsync(
        HttpContext httpContext,
        SessionService sessionService,
        CancellationToken cancellationToken)
    {
        SetNoStoreHeaders(httpContext);

        var sessionUser =
            await PortalAuthorization.GetSessionUserAsync(
                httpContext,
                sessionService,
                cancellationToken
            );

        if (sessionUser is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(
            new SessionResponse(
                sessionUser.UserId,
                sessionUser.Name,
                sessionUser.Email,
                sessionUser.Department,
                sessionUser.DepartemenCode,
                sessionUser.JobTitle,
                sessionUser.ExpiresAt
            )
        );
    }

    private static CookieOptions CreateSessionCookieOptions(
        bool secure,
        DateTimeOffset expiresAt)
    {
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = secure,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = expiresAt,
            IsEssential = true
        };
    }

    private static CookieOptions CreateCsrfCookieOptions(
        bool secure,
        DateTimeOffset expiresAt)
    {
        return new CookieOptions
        {
            HttpOnly = false,
            Secure = secure,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = expiresAt,
            IsEssential = true
        };
    }

    private static CookieOptions
        CreateSessionDeleteCookieOptions(
            bool secure)
    {
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = secure,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            IsEssential = true
        };
    }

    private static CookieOptions
        CreateCsrfDeleteCookieOptions(
            bool secure)
    {
        return new CookieOptions
        {
            HttpOnly = false,
            Secure = secure,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            IsEssential = true
        };
    }

    private static void SetNoStoreHeaders(
        HttpContext httpContext)
    {
        httpContext.Response.Headers.CacheControl =
            "no-store, no-cache, must-revalidate";

        httpContext.Response.Headers.Pragma =
            "no-cache";

        httpContext.Response.Headers.Expires =
            "0";
    }

    private sealed record SessionResponse(
        long UserId,
        string Name,
        string Email,
        string? Department,
        string? DepartemenCode,
        string? JobTitle,
        DateTimeOffset ExpiresAt
    );

    private sealed record LoginLockedResponse(
        string Error,
        int RetryAfterSeconds
    );
}
