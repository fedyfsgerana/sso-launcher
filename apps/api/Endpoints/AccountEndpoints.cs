#nullable enable

using SsoLauncher.Api.Authorization;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Account;
using SsoLauncher.Application.Auth.Session;
using SsoLauncher.Application.Users;

namespace SsoLauncher.Api.Endpoints;

public static class AccountEndpoints
{
    public static IEndpointRouteBuilder MapAccountEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints
            .MapGroup("/api/account")
            .WithTags("Account");

        group.MapGet("/sessions", GetSessionsAsync)
            .WithName("GetAccountSessions")
            .WithSummary("Get active sessions of the current user")
            .WithDescription(
                "Returns every active sign-in session of the signed-in user with its device and last activity."
            )
            .Produces<IReadOnlyList<AccountSessionResponse>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapDelete("/sessions/{sessionId:long}", RevokeSessionAsync)
            .WithName("RevokeAccountSession")
            .WithSummary("Sign out another session of the current user")
            .WithDescription(
                "Revokes one active session of the signed-in user. The current session cannot be revoked here; use logout instead."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/sessions/revoke-others", RevokeOtherSessionsAsync)
            .WithName("RevokeOtherAccountSessions")
            .WithSummary("Sign out every other session of the current user")
            .WithDescription(
                "Revokes all active sessions of the signed-in user except the current one."
            )
            .Produces<RevokedSessionsResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapGet("/notification-settings", GetNotificationSettingsAsync)
            .WithName("GetNotificationSettings")
            .WithSummary("Get notification preferences of the current user")
            .WithDescription(
                "Returns which optional notifications the signed-in user receives. Security notifications are always delivered."
            )
            .Produces<NotificationSettingsResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapPut("/notification-settings", UpdateNotificationSettingsAsync)
            .WithName("UpdateNotificationSettings")
            .WithSummary("Update notification preferences of the current user")
            .WithDescription(
                "Turns optional notifications for access changes and application status on or off."
            )
            .Produces<NotificationSettingsResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapGet("/security-policy", GetSecurityPolicyAsync)
            .WithName("GetSecurityPolicy")
            .WithSummary("Get the security rules that apply to accounts")
            .WithDescription(
                "Returns the session, sign-in lock and password rules currently configured on the server."
            )
            .Produces<SecurityPolicyResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized);

        return endpoints;
    }

    private static async Task<IResult> GetSessionsAsync(
        HttpContext httpContext,
        SessionService sessionService,
        AccountSessionService accountSessionService,
        CancellationToken cancellationToken)
    {
        var (user, token) = await CurrentAsync(httpContext, sessionService, cancellationToken);

        if (user is null || token is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(
            await accountSessionService.GetAsync(user.UserId, token, cancellationToken)
        );
    }

    private static async Task<IResult> RevokeSessionAsync(
        long sessionId,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        AccountSessionService accountSessionService,
        CancellationToken cancellationToken)
    {
        var (user, token) = await CurrentAsync(httpContext, sessionService, cancellationToken);

        if (user is null || token is null)
        {
            return Results.Unauthorized();
        }

        if (!PortalCsrf.Validate(httpContext, csrfTokenService))
        {
            return Results.StatusCode(StatusCodes.Status403Forbidden);
        }

        var revoked = await accountSessionService.RevokeAsync(
            user.UserId,
            user.Name,
            sessionId,
            token,
            cancellationToken
        );

        return revoked ? Results.NoContent() : Results.NotFound();
    }

    private static async Task<IResult> RevokeOtherSessionsAsync(
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        AccountSessionService accountSessionService,
        CancellationToken cancellationToken)
    {
        var (user, token) = await CurrentAsync(httpContext, sessionService, cancellationToken);

        if (user is null || token is null)
        {
            return Results.Unauthorized();
        }

        if (!PortalCsrf.Validate(httpContext, csrfTokenService))
        {
            return Results.StatusCode(StatusCodes.Status403Forbidden);
        }

        var revoked = await accountSessionService.RevokeOthersAsync(
            user.UserId,
            user.Name,
            token,
            cancellationToken
        );

        return Results.Ok(new RevokedSessionsResponse(revoked));
    }

    private static async Task<IResult> GetNotificationSettingsAsync(
        HttpContext httpContext,
        SessionService sessionService,
        NotificationSettingsService settingsService,
        CancellationToken cancellationToken)
    {
        var user = await PortalAuthorization.GetSessionUserAsync(
            httpContext,
            sessionService,
            cancellationToken
        );

        return user is null
            ? Results.Unauthorized()
            : Results.Ok(await settingsService.GetAsync(user.UserId, cancellationToken));
    }

    private static async Task<IResult> UpdateNotificationSettingsAsync(
        NotificationSettingsResponse request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        NotificationSettingsService settingsService,
        CancellationToken cancellationToken)
    {
        var user = await PortalAuthorization.GetSessionUserAsync(
            httpContext,
            sessionService,
            cancellationToken
        );

        if (user is null)
        {
            return Results.Unauthorized();
        }

        if (!PortalCsrf.Validate(httpContext, csrfTokenService))
        {
            return Results.StatusCode(StatusCodes.Status403Forbidden);
        }

        return Results.Ok(
            await settingsService.UpdateAsync(user.UserId, request, cancellationToken)
        );
    }

    private static async Task<IResult> GetSecurityPolicyAsync(
        HttpContext httpContext,
        SessionService sessionService,
        ISessionLifetimeProvider sessionLifetimeProvider,
        ILoginLockoutPolicy lockoutPolicy,
        CancellationToken cancellationToken)
    {
        var user = await PortalAuthorization.GetSessionUserAsync(
            httpContext,
            sessionService,
            cancellationToken
        );

        if (user is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(new SecurityPolicyResponse(
            (int)sessionLifetimeProvider.IdleTimeout.TotalMinutes,
            (int)sessionLifetimeProvider.Lifetime.TotalHours,
            lockoutPolicy.MaxFailuresPerAddress,
            lockoutPolicy.MaxFailuresPerAccount,
            (int)lockoutPolicy.Window.TotalMinutes,
            PasswordRules.MinimumLength,
            PasswordRules.RequiresMixedCharacters
        ));
    }

    private static async Task<(SessionUser? User, string? Token)> CurrentAsync(
        HttpContext httpContext,
        SessionService sessionService,
        CancellationToken cancellationToken)
    {
        var user = await PortalAuthorization.GetSessionUserAsync(
            httpContext,
            sessionService,
            cancellationToken
        );

        var token = httpContext.Request.Cookies[PortalAuthorization.SessionCookieName];

        return (user, string.IsNullOrWhiteSpace(token) ? null : token);
    }

    private sealed record RevokedSessionsResponse(int Revoked);
}
