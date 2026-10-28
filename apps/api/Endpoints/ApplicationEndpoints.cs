using Microsoft.AspNetCore.Http.HttpResults;
using SsoLauncher.Api.Authorization;
using SsoLauncher.Application.Applications.GetMyApplications;
using SsoLauncher.Application.Auth.Session;

namespace SsoLauncher.Api.Endpoints;

public static class ApplicationEndpoints
{
    public static IEndpointRouteBuilder MapApplicationEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(
                "/api/applications/me",
                GetMyApplicationsAsync
            )
            .WithName("GetMyApplications")
            .WithTags("Applications")
            .WithSummary("Get applications available to the current user")
            .WithDescription(
                "Returns active applications the authenticated portal user is currently allowed to launch."
            )
            .Produces<IReadOnlyList<MyApplicationResponse>>(
                StatusCodes.Status200OK
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            );

        return endpoints;
    }

    private static async Task<Results<
        Ok<IReadOnlyList<MyApplicationResponse>>,
        UnauthorizedHttpResult>> GetMyApplicationsAsync(
        HttpContext httpContext,
        SessionService sessionService,
        GetMyApplicationsService applicationsService,
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
            return TypedResults.Unauthorized();
        }

        var applications =
            await applicationsService.GetAsync(
                user.UserId,
                cancellationToken
            );

        return TypedResults.Ok(applications);
    }
}
