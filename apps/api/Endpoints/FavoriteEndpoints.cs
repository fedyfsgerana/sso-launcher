using SsoLauncher.Api.Authorization;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Auth.Session;
using SsoLauncher.Application.Favorites.AddFavorite;
using SsoLauncher.Application.Favorites.GetFavorites;
using SsoLauncher.Application.Favorites.RemoveFavorite;

namespace SsoLauncher.Api.Endpoints;

public static class FavoriteEndpoints
{
    public static IEndpointRouteBuilder MapFavoriteEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints
            .MapGroup("/api/favorites")
            .WithTags("Favorites");

        group.MapGet("/", GetFavoritesAsync)
            .WithName("GetFavorites")
            .WithSummary("Get favorite application ids")
            .WithDescription(
                "Returns application ids marked as favorite by the authenticated user."
            )
            .Produces<IReadOnlyList<long>>(
                StatusCodes.Status200OK
            )
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapPut("/{applicationId:long}", AddFavoriteAsync)
            .WithName("AddFavorite")
            .WithSummary("Mark an application as favorite")
            .WithDescription(
                "Marks an accessible application as favorite for the authenticated user."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapDelete("/{applicationId:long}", RemoveFavoriteAsync)
            .WithName("RemoveFavorite")
            .WithSummary("Remove an application from favorites")
            .WithDescription(
                "Removes a favorite entry for the authenticated user."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static async Task<IResult> GetFavoritesAsync(
        HttpContext httpContext,
        SessionService sessionService,
        GetFavoritesService getFavoritesService,
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

        var favorites = await getFavoritesService.GetAsync(
            user.UserId,
            cancellationToken
        );

        return Results.Ok(favorites);
    }

    private static async Task<IResult> AddFavoriteAsync(
        long applicationId,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        AddFavoriteService addFavoriteService,
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

        var added = await addFavoriteService.AddAsync(
            user.UserId,
            applicationId,
            cancellationToken
        );

        if (!added)
        {
            return Results.BadRequest();
        }

        return Results.NoContent();
    }

    private static async Task<IResult> RemoveFavoriteAsync(
        long applicationId,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        RemoveFavoriteService removeFavoriteService,
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

        var removed = await removeFavoriteService.RemoveAsync(
            user.UserId,
            applicationId,
            cancellationToken
        );

        if (!removed)
        {
            return Results.NotFound();
        }

        return Results.NoContent();
    }
}