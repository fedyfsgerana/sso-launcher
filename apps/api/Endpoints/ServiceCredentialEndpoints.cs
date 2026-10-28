using SsoLauncher.Api.Authorization;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Auth.Session;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Application.ServiceCredentials.CreateServiceCredential;
using SsoLauncher.Application.ServiceCredentials.GetServiceCredentials;
using SsoLauncher.Application.ServiceCredentials.DeleteServiceCredential;
using SsoLauncher.Application.ServiceCredentials.DiscardServiceCredential;
using SsoLauncher.Application.ServiceCredentials.IntegrationPackage;
using SsoLauncher.Application.ServiceCredentials.RevokeServiceCredential;

namespace SsoLauncher.Api.Endpoints;

public static class ServiceCredentialEndpoints
{
    public static IEndpointRouteBuilder MapServiceCredentialEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints
            .MapGroup("/api/admin/service-credentials")
            .WithTags("Service Credentials");

        group.MapGet("/", GetServiceCredentialsAsync)
            .WithName("GetServiceCredentials")
            .WithSummary("Get service credentials")
            .WithDescription(
                "Returns service credentials, optionally filtered by application. Requires an authenticated administrator."
            )
            .Produces<IReadOnlyList<ServiceCredentialResponse>>(
                StatusCodes.Status200OK
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            )
            .Produces(
                StatusCodes.Status403Forbidden
            );

        group.MapPost("/", CreateServiceCredentialAsync)
            .WithName("CreateServiceCredential")
            .WithSummary("Create a service credential")
            .WithDescription(
                "Creates a service credential for an application. The client secret is returned when the credential is created. Requires an authenticated administrator and a valid CSRF token."
            )
            .Produces<CreateServiceCredentialResponse>(
                StatusCodes.Status200OK
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

        group.MapDelete("/{id:long}", RevokeServiceCredentialAsync)
            .WithName("RevokeServiceCredential")
            .WithSummary("Revoke a service credential")
            .WithDescription(
                "Revokes an existing service credential. Requires an authenticated administrator and a valid CSRF token."
            )
            .Produces(
                StatusCodes.Status204NoContent
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            )
            .Produces(
                StatusCodes.Status403Forbidden
            )
            .Produces(
                StatusCodes.Status404NotFound
            );

        group.MapPost("/{id:long}/integration-guide", ClaimIntegrationGuideAsync)
            .WithName("ClaimIntegrationGuide")
            .WithSummary("Download the SSO integration guide of a new credential, once")
            .WithDescription(
                "Returns the Markdown guide with the application data, ready-to-use settings and the full SSO guide, and marks it as downloaded. The client id and secret are placeholders that the browser fills in, so the secret never travels back to the server. Allowed once per credential, within an hour of its creation and before it is first used. Requires the manage credentials permission and a valid CSRF token."
            )
            .Produces<IntegrationPackageTemplate>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict);

        group.MapPost("/{id:long}/discard", DiscardServiceCredentialAsync)
            .WithName("DiscardServiceCredential")
            .WithSummary("Discard a credential that was never confirmed")
            .WithDescription(
                "Removes a credential created moments ago when the administrator closes the dialog without confirming that the secret was saved. Only allowed for credentials that were never used and are less than an hour old. Requires the manage credentials permission and a valid CSRF token."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict);

        group.MapDelete("/{id:long}/record", DeleteServiceCredentialAsync)
            .WithName("DeleteServiceCredential")
            .WithSummary("Delete a revoked service credential")
            .WithDescription(
                "Removes a credential that has already been revoked. Active credentials must be revoked first. Requires the manage credentials permission, a valid CSRF token and a reason query parameter."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict);

        return endpoints;
    }

    private static async Task<IResult> ClaimIntegrationGuideAsync(
        long id,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        IConfiguration configuration,
        IntegrationPackageService packages,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeActionAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Applications,
                MenuActions.ManageCredentials,
                cancellationToken
            );

        if (!authorization.IsAuthenticated)
        {
            return Results.Unauthorized();
        }

        if (!authorization.IsAuthorized ||
            !PortalCsrf.Validate(httpContext, csrfTokenService))
        {
            return Results.StatusCode(StatusCodes.Status403Forbidden);
        }

        var result = await packages.ClaimAsync(
            id,
            IntegrationGuideSource.Addresses(httpContext, configuration),
            await IntegrationGuideSource.ReadGuideAsync(cancellationToken),
            cancellationToken
        );

        httpContext.Response.Headers.CacheControl = "no-store";

        return result.Outcome switch
        {
            IntegrationGuideOutcome.Ready => Results.Ok(result.Template),
            IntegrationGuideOutcome.AlreadyDownloaded => Results.Conflict(
                new { error = "guide_already_downloaded" }
            ),
            IntegrationGuideOutcome.Expired => Results.Conflict(
                new { error = "guide_expired" }
            ),
            _ => Results.NotFound()
        };
    }

    private static async Task<IResult> DiscardServiceCredentialAsync(
        long id,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        DiscardServiceCredentialService service,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeActionAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Applications,
                MenuActions.ManageCredentials,
                cancellationToken
            );

        if (!authorization.IsAuthenticated)
        {
            return Results.Unauthorized();
        }

        if (!authorization.IsAuthorized ||
            !PortalCsrf.Validate(httpContext, csrfTokenService))
        {
            return Results.StatusCode(StatusCodes.Status403Forbidden);
        }

        return await service.DiscardAsync(id, cancellationToken) switch
        {
            DiscardServiceCredentialOutcome.Discarded => Results.NoContent(),
            DiscardServiceCredentialOutcome.TooLate => Results.Conflict(
                new { error = "credential_in_use" }
            ),
            _ => Results.NotFound()
        };
    }

    private static async Task<IResult> DeleteServiceCredentialAsync(
        long id,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        DeleteServiceCredentialService service,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeActionAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Applications,
                MenuActions.ManageCredentials,
                cancellationToken
            );

        if (!authorization.IsAuthenticated)
        {
            return Results.Unauthorized();
        }

        if (!authorization.IsAuthorized ||
            !PortalCsrf.Validate(httpContext, csrfTokenService))
        {
            return Results.StatusCode(StatusCodes.Status403Forbidden);
        }

        return await service.DeleteAsync(id, cancellationToken) switch
        {
            DeleteServiceCredentialOutcome.Deleted => Results.NoContent(),
            DeleteServiceCredentialOutcome.StillActive => Results.Conflict(
                new { error = "credential_active" }
            ),
            _ => Results.NotFound()
        };
    }

    private static async Task<IResult> GetServiceCredentialsAsync(
        long? applicationId,
        HttpContext httpContext,
        SessionService sessionService,
        GetServiceCredentialsService service,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeMenuAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Applications,
                cancellationToken
            );

        if (!authorization.IsAuthenticated)
        {
            return Results.Unauthorized();
        }

        if (!authorization.IsAuthorized)
        {
            return Results.StatusCode(
                StatusCodes.Status403Forbidden
            );
        }

        var result =
            await service.GetAsync(
                applicationId,
                cancellationToken
            );

        return Results.Ok(result);
    }

    private static async Task<IResult> CreateServiceCredentialAsync(
        CreateServiceCredentialRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        CreateServiceCredentialService service,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeActionAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Applications,
                MenuActions.ManageCredentials,
                cancellationToken
            );

        if (!authorization.IsAuthenticated)
        {
            return Results.Unauthorized();
        }

        if (!authorization.IsAuthorized)
        {
            return Results.StatusCode(
                StatusCodes.Status403Forbidden
            );
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
            await service.CreateAsync(
                request,
                cancellationToken
            );

        return result is null
            ? Results.BadRequest()
            : Results.Ok(result);
    }

    private static async Task<IResult> RevokeServiceCredentialAsync(
        long id,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        RevokeServiceCredentialService service,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeActionAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Applications,
                MenuActions.ManageCredentials,
                cancellationToken
            );

        if (!authorization.IsAuthenticated)
        {
            return Results.Unauthorized();
        }

        if (!authorization.IsAuthorized)
        {
            return Results.StatusCode(
                StatusCodes.Status403Forbidden
            );
        }

        if (!PortalCsrf.Validate(
                httpContext,
                csrfTokenService))
        {
            return Results.StatusCode(
                StatusCodes.Status403Forbidden
            );
        }

        var revoked =
            await service.RevokeAsync(
                id,
                cancellationToken
            );

        return revoked
            ? Results.NoContent()
            : Results.NotFound();
    }
}
