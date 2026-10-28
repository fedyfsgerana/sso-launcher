using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.RateLimiting;
using SsoLauncher.Application.ServiceCredentials.IssueServiceAccessToken;

namespace SsoLauncher.Api.Endpoints;

public static class ServiceAuthEndpoints
{
    public static IEndpointRouteBuilder MapServiceAuthEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints
            .MapGroup("/api/service-auth")
            .WithTags("Service Authentication");

        group.MapPost("/token", IssueTokenAsync)
            .WithName("IssueServiceAccessToken")
            .WithSummary("Issue a service access token")
            .WithDescription(
                "Authenticates an application service credential and issues a short-lived bearer token for service-to-service API access."
            )
            .Produces<IssueServiceAccessTokenResponse>(
                StatusCodes.Status200OK
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            )
            .Produces(
                StatusCodes.Status429TooManyRequests
            )
            .RequireRateLimiting("ServiceAuth");

        return endpoints;
    }

    private static async Task<Results<
        Ok<IssueServiceAccessTokenResponse>,
        UnauthorizedHttpResult>> IssueTokenAsync(
        IssueServiceAccessTokenRequest request,
        IssueServiceAccessTokenService service,
        CancellationToken cancellationToken)
    {
        var result =
            await service.IssueAsync(
                request,
                cancellationToken
            );

        return result is null
            ? TypedResults.Unauthorized()
            : TypedResults.Ok(result);
    }
}