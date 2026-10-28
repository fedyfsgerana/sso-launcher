using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Directory;
using SsoLauncher.Application.ServiceCredentials;

namespace SsoLauncher.Api.Endpoints;

public static class DirectoryEndpoints
{
    private const string BearerPrefix = "Bearer ";

    public static IEndpointRouteBuilder MapDirectoryEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints
            .MapGroup("/api/directory")
            .WithTags("Directory");

        group.MapGet("/users", ListUsersAsync)
            .WithName("ListDirectoryUsers")
            .WithSummary("List portal users who can open the calling application")
            .WithDescription(
                "Returns active portal users with access to the calling application, with the groups that grant access and whether the access is direct. Requires a service bearer token with the users.read scope. Supports search, updatedSince, page and pageSize (max 200)."
            )
            .Produces<DirectoryUserListResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/users/{userId:long}", GetUserAsync)
            .WithName("GetDirectoryUser")
            .WithSummary("Check a portal user for the calling application")
            .WithDescription(
                "Returns whether a portal user is still active and still has access to the calling application. Requires a service bearer token with the users.read scope."
            )
            .Produces<DirectoryUserStatusResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static async Task<IResult> ListUsersAsync(
        HttpContext httpContext,
        IServiceAccessTokenService serviceAccessTokenService,
        DirectoryService directoryService,
        string? search,
        DateTimeOffset? updatedSince,
        int? page,
        int? pageSize,
        CancellationToken cancellationToken)
    {
        var applicationId = await AuthorizeAsync(
            httpContext,
            serviceAccessTokenService,
            directoryService,
            cancellationToken
        );

        if (applicationId is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(await directoryService.ListAsync(
            applicationId.Value,
            search,
            updatedSince,
            page ?? 1,
            pageSize ?? 50,
            cancellationToken
        ));
    }

    private static async Task<IResult> GetUserAsync(
        long userId,
        HttpContext httpContext,
        IServiceAccessTokenService serviceAccessTokenService,
        DirectoryService directoryService,
        CancellationToken cancellationToken)
    {
        var applicationId = await AuthorizeAsync(
            httpContext,
            serviceAccessTokenService,
            directoryService,
            cancellationToken
        );

        if (applicationId is null)
        {
            return Results.Unauthorized();
        }

        var status = await directoryService.GetAsync(
            applicationId.Value,
            userId,
            cancellationToken
        );

        return status is null ? Results.NotFound() : Results.Ok(status);
    }

    private static async Task<long?> AuthorizeAsync(
        HttpContext httpContext,
        IServiceAccessTokenService serviceAccessTokenService,
        DirectoryService directoryService,
        CancellationToken cancellationToken)
    {
        var authorization = httpContext.Request.Headers.Authorization.FirstOrDefault();

        if (string.IsNullOrWhiteSpace(authorization) ||
            !authorization.StartsWith(BearerPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var identity = serviceAccessTokenService.Validate(
            authorization[BearerPrefix.Length..].Trim()
        );

        if (identity is null ||
            !ServiceScopes.Contains(identity.Scope, ServiceScopes.UsersRead))
        {
            return null;
        }

        var allowed = await directoryService.IsAllowedAsync(
            identity.ApplicationId,
            identity.ClientId,
            cancellationToken
        );

        return allowed ? identity.ApplicationId : null;
    }
}