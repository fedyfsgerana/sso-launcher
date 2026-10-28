using Microsoft.AspNetCore.Http.HttpResults;

namespace SsoLauncher.Api.Endpoints;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(
                "/health",
                GetHealth
            )
            .WithName("GetHealth")
            .WithTags("Health")
            .WithSummary(
                "Get API health status"
            )
            .WithDescription(
                "Returns the current health status of the SSO Launcher API."
            )
            .Produces<HealthResponse>(
                StatusCodes.Status200OK
            );

        return endpoints;
    }

    private static Ok<HealthResponse> GetHealth()
    {
        return TypedResults.Ok(
            new HealthResponse(
                "healthy",
                "sso-launcher-api"
            )
        );
    }

    public sealed record HealthResponse(
        string Status,
        string Service
    );
}