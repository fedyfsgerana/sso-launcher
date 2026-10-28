using SsoLauncher.Api.Authorization;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Auth.Session;
using SsoLauncher.Application.Overview;

namespace SsoLauncher.Api.Endpoints;

public static class OverviewEndpoints
{
    private const int SessionRefLength = 16;

    public static IEndpointRouteBuilder MapOverviewEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/overview/insights", GetInsightsAsync)
            .WithTags("Overview")
            .WithName("GetOverviewInsights")
            .WithSummary("Get dashboard insights for the current user")
            .WithDescription(
                "Returns the previous successful sign-in of the current user and, for users with the matching menus, the number of locked accounts and failed sign-ins in the last 24 hours."
            )
            .Produces<OverviewInsightsResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized);

        return endpoints;
    }

    private static async Task<IResult> GetInsightsAsync(
        HttpContext httpContext,
        SessionService sessionService,
        ISessionTokenService sessionTokenService,
        GetOverviewInsightsService insightsService,
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

        var sessionToken =
            httpContext.Request.Cookies[PortalAuthorization.SessionCookieName];

        var currentSessionRef = string.IsNullOrWhiteSpace(sessionToken)
            ? null
            : sessionTokenService.Hash(sessionToken)[..SessionRefLength];

        var includeLockedAccounts = await sessionService.HasMenuAccessAsync(
            user.UserId,
            PortalMenuTargets.Users,
            cancellationToken
        );

        var includeFailedLogins = await sessionService.HasMenuAccessAsync(
            user.UserId,
            PortalMenuTargets.Audit,
            cancellationToken
        );

        var insights = await insightsService.GetAsync(
            user.UserId,
            currentSessionRef,
            includeLockedAccounts,
            includeFailedLogins,
            cancellationToken
        );

        return Results.Ok(insights);
    }
}
