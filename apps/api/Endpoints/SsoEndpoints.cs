using Microsoft.AspNetCore.Http.HttpResults;
using SsoLauncher.Api.Authorization;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Auth.Session;
using SsoLauncher.Application.ServiceCredentials;
using SsoLauncher.Application.Sso.Launch;
using SsoLauncher.Application.Sso.SessionStatus;
using SsoLauncher.Application.Sso.SignOut;
using SsoLauncher.Application.Sso.Validate;

namespace SsoLauncher.Api.Endpoints;

public static class SsoEndpoints
{
    public static IEndpointRouteBuilder MapSsoEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints
            .MapGroup("/api/sso")
            .WithTags("SSO");

        group.MapPost("/launch", LaunchAsync)
            .WithName("LaunchApplication")
            .WithSummary("Create an SSO launch for an application")
            .WithDescription(
                "Creates a short-lived SSO token for an application the authenticated user is currently allowed to launch. Applications that do not use SSO get their plain address. Returns 409 when an SSO application has no active credential yet. The request requires a valid CSRF token."
            )
            .Produces<LaunchApplicationResponse>(
                StatusCodes.Status200OK
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            )
            .Produces(
                StatusCodes.Status403Forbidden
            )
            .Produces(
                StatusCodes.Status404NotFound
            )
            .Produces<LaunchApplicationError>(
                StatusCodes.Status409Conflict
            );

        group.MapPost("/validate", ValidateAsync)
            .WithName("ValidateSsoToken")
            .WithSummary("Validate an SSO token")
            .WithDescription(
                "Validates an SSO token for the calling application. Requires a valid service bearer token with the sso.validate scope."
            )
            .Produces<ValidateSsoTokenResponse>(
                StatusCodes.Status200OK
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            );

        group.MapPost("/session", SessionStatusAsync)
            .WithName("CheckSsoSession")
            .WithSummary("Check and extend the portal session of one user")
            .WithDescription(
                "Tells the calling application whether the user still has an active portal session and access to that application, and refreshes the session so portal and application stay in sync."
            )
            .Produces<SsoSessionStatusResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapPost("/sign-out", SignOutAsync)
            .WithName("SignOutApplication")
            .WithSummary("Record that the user signed out of an application")
            .WithDescription(
                "Records that the authenticated user signed out of one application and returned to the portal. The portal session stays active. The request requires a valid CSRF token."
            )
            .Produces<SignOutApplicationResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static async Task<IResult> SessionStatusAsync(
        SsoSessionStatusRequest request,
        IServiceAccessTokenService serviceAccessTokenService,
        SsoSessionStatusService sessionStatusService,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var authorization = httpContext.Request.Headers.Authorization
            .FirstOrDefault();

        if (string.IsNullOrWhiteSpace(authorization) ||
            !authorization.StartsWith(
                "Bearer ",
                StringComparison.OrdinalIgnoreCase))
        {
            return TypedResults.Unauthorized();
        }

        var serviceIdentity = serviceAccessTokenService.Validate(
            authorization["Bearer ".Length..].Trim()
        );

        if (serviceIdentity is null ||
            !ServiceScopes.Contains(
                serviceIdentity.Scope,
                ServiceScopes.SsoValidate))
        {
            return TypedResults.Unauthorized();
        }

        return TypedResults.Ok(
            await sessionStatusService.CheckAsync(
                request.UserId,
                serviceIdentity.ApplicationId,
                serviceIdentity.ClientId,
                ServiceScopes.SsoValidate,
                request.KeepAlive ?? true,
                cancellationToken
            )
        );
    }

    private static async Task<IResult> SignOutAsync(
        SignOutApplicationRequest request,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        SignOutApplicationService signOutService,
        HttpContext httpContext,
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
            await signOutService.SignOutAsync(
                user.UserId,
                request.Slug ?? string.Empty,
                cancellationToken
            );

        return result is null
            ? Results.NotFound()
            : Results.Ok(result);
    }

    private static async Task<IResult> LaunchAsync(
        LaunchApplicationRequest request,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        LaunchApplicationService launchService,
        HttpContext httpContext,
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
            await launchService.LaunchAsync(
                user.UserId,
                request.ApplicationId,
                cancellationToken
            );

        return result.Outcome switch
        {
            LaunchApplicationOutcome.Launched => Results.Ok(result.Response),
            LaunchApplicationOutcome.SsoNotReady => Results.Conflict(
                new LaunchApplicationError("sso_not_ready")
            ),
            _ => Results.NotFound()
        };
    }

    private static async Task<Results<
        Ok<ValidateSsoTokenResponse>,
        UnauthorizedHttpResult>> ValidateAsync(
        ValidateSsoTokenRequest request,
        IServiceAccessTokenService serviceAccessTokenService,
        ValidateSsoTokenService validateService,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var authorization =
            httpContext.Request.Headers.Authorization
                .FirstOrDefault();

        if (string.IsNullOrWhiteSpace(authorization) ||
            !authorization.StartsWith(
                "Bearer ",
                StringComparison.OrdinalIgnoreCase))
        {
            return TypedResults.Unauthorized();
        }

        var accessToken =
            authorization["Bearer ".Length..]
                .Trim();

        var serviceIdentity =
            serviceAccessTokenService.Validate(
                accessToken
            );

        if (serviceIdentity is null ||
            !ServiceScopes.Contains(
                serviceIdentity.Scope,
                ServiceScopes.SsoValidate))
        {
            return TypedResults.Unauthorized();
        }

        var result =
            await validateService.ValidateAsync(
                request.Token,
                serviceIdentity.ApplicationId,
                serviceIdentity.ClientId,
                ServiceScopes.SsoValidate,
                cancellationToken
            );

        return result is null
            ? TypedResults.Unauthorized()
            : TypedResults.Ok(result);
    }

    public sealed record LaunchApplicationRequest(
        long ApplicationId
    );

    public sealed record LaunchApplicationError(
        string Code
    );

    public sealed record ValidateSsoTokenRequest(
        string Token
    );

    public sealed record SignOutApplicationRequest(
        string? Slug
    );

    public sealed record SsoSessionStatusRequest(
        long UserId,
        bool? KeepAlive
    );
}
