#nullable enable

using SsoLauncher.Api.Authorization;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Applications.CreateApplication;
using SsoLauncher.Application.Applications.DeleteApplication;
using SsoLauncher.Application.Applications.GetApplicationUsers;
using SsoLauncher.Application.Applications.GetApplications;
using SsoLauncher.Application.Applications.UpdateApplication;
using SsoLauncher.Application.Auth.Session;
using SsoLauncher.Application.Common.Paging;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Api.Endpoints;

public static class ApplicationManagementEndpoints
{
    public static IEndpointRouteBuilder MapApplicationManagementEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints
            .MapGroup("/api/admin/applications")
            .WithTags("Applications Management");

        group.MapGet("/summary", GetApplicationsSummaryAsync)
            .WithName("GetApplicationsSummary")
            .WithSummary("Get registered application counts")
            .WithDescription(
                "Returns the number of registered applications in total, active, under maintenance, and inactive. Requires an authenticated administrator."
            )
            .Produces<ApplicationSummaryResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapGet("/page", GetApplicationsPageAsync)
            .WithName("GetApplicationsPage")
            .WithSummary("Get a page of registered applications")
            .WithDescription(
                "Returns one page of registered applications with search, filters, and sorting applied on the server. Requires an authenticated administrator."
            )
            .Produces<PagedResponse<ApplicationResponse>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapGet("/", GetApplicationsAsync)
            .WithName("GetApplications")
            .WithSummary("Get all registered applications")
            .WithDescription(
                "Returns all registered SSO Launcher applications. Requires an authenticated administrator."
            )
            .Produces<IEnumerable<ApplicationResponse>>(
                StatusCodes.Status200OK
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            )
            .Produces(
                StatusCodes.Status403Forbidden
            );

        group.MapPost("/", CreateApplicationAsync)
            .WithName("CreateApplication")
            .WithSummary("Create an application")
            .WithDescription(
                "Registers a new application in SSO Launcher. Requires an authenticated administrator and a valid CSRF token."
            )
            .Produces<CreateApplicationResponse>(
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

        group.MapPut(
                "/{applicationId:long}",
                UpdateApplicationAsync
            )
            .WithName("UpdateApplication")
            .WithSummary("Update an application")
            .WithDescription(
                "Updates an existing registered application. Requires an authenticated administrator and a valid CSRF token."
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

        group.MapDelete("/{applicationId:long}", DeleteApplicationAsync)
            .WithName("DeleteApplication")
            .WithSummary("Delete an application")
            .WithDescription(
                "Deletes an application together with its menus, accesses, and favorites."
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

        group.MapGet("/{applicationId:long}/users", GetApplicationUsersAsync)
            .WithName("GetApplicationUsers")
            .WithSummary("Get the users who can open an application")
            .WithDescription(
                "Returns every user with access to one application, including the groups that grant it and whether the access is direct."
            )
            .Produces<IReadOnlyList<ApplicationUserResponse>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static async Task<IResult> DeleteApplicationAsync(
        long applicationId,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        DeleteApplicationService deleteApplicationService,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeActionAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Applications,
                MenuActions.Delete,
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

        var deleted =
            await deleteApplicationService.DeleteAsync(
                applicationId,
                authorization.User!.UserId,
                authorization.User.Name,
                cancellationToken
            );

        return deleted
            ? Results.NoContent()
            : Results.NotFound();
    }

    private static async Task<IResult> GetApplicationsAsync(
        HttpContext httpContext,
        SessionService sessionService,
        GetApplicationsService getApplicationsService,
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

        var applications =
            await getApplicationsService.GetAsync(
                cancellationToken
            );

        return Results.Ok(applications);
    }

    private static async Task<IResult> GetApplicationsSummaryAsync(
        HttpContext httpContext,
        SessionService sessionService,
        GetApplicationsService getApplicationsService,
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

        var summary = await getApplicationsService.GetSummaryAsync(cancellationToken);

        return Results.Ok(summary);
    }

    private static async Task<IResult> GetApplicationsPageAsync(
        [AsParameters] ApplicationPageRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        GetApplicationsService getApplicationsService,
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

        var page = await getApplicationsService.GetPageAsync(
            request,
            cancellationToken
        );

        return Results.Ok(page);
    }

    private static async Task<IResult> CreateApplicationAsync(
        CreateApplicationRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        CreateApplicationService createApplicationService,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeActionAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Applications,
                MenuActions.Create,
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

        var applicationId =
            await createApplicationService.CreateAsync(
                request,
                authorization.User!.UserId,
                authorization.User.Name,
                cancellationToken
            );

        if (applicationId is null)
        {
            return Results.BadRequest();
        }

        return Results.Ok(
            new CreateApplicationResponse(
                applicationId.Value
            )
        );
    }

    private static async Task<IResult> UpdateApplicationAsync(
        long applicationId,
        UpdateApplicationRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        UpdateApplicationService updateApplicationService,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeActionAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Applications,
                MenuActions.Update,
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

        var updated =
            await updateApplicationService.UpdateAsync(
                applicationId,
                request,
                authorization.User!.UserId,
                authorization.User.Name,
                cancellationToken
            );

        return updated
            ? Results.NoContent()
            : Results.NotFound();
    }

    private sealed record CreateApplicationResponse(
        long Id
    );

    private static async Task<IResult> GetApplicationUsersAsync(
        long applicationId,
        HttpContext httpContext,
        SessionService sessionService,
        GetApplicationUsersService getApplicationUsersService,
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
            return Results.StatusCode(StatusCodes.Status403Forbidden);
        }

        var users = await getApplicationUsersService.GetAsync(
            applicationId,
            cancellationToken
        );

        return users is null
            ? Results.NotFound()
            : Results.Ok(users);
    }
}
