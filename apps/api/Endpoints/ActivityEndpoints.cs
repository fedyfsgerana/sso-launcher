using SsoLauncher.Api.Authorization;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Activities.ClearActivities;
using SsoLauncher.Application.Activities.DeleteActivity;
using SsoLauncher.Application.Activities.GetActivities;
using SsoLauncher.Application.Activities.GetRecentActions;
using SsoLauncher.Application.Activities.RecordActivity;
using SsoLauncher.Application.Auth.Session;

namespace SsoLauncher.Api.Endpoints;

public static class ActivityEndpoints
{
    public static IEndpointRouteBuilder MapActivityEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints
            .MapGroup("/api/activities")
            .WithTags("Activities");

        group.MapGet("/", GetActivitiesAsync)
            .WithName("GetActivities")
            .WithSummary("Get recent portal activities")
            .WithDescription(
                "Returns the most recent applications, documents, and features opened by the authenticated user."
            )
            .Produces<IReadOnlyList<ActivityResponse>>(
                StatusCodes.Status200OK
            )
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/recent-actions", GetRecentActionsAsync)
            .WithName("GetRecentActions")
            .WithSummary("Get recent actions of the current user")
            .WithDescription(
                "Returns the newest create, update, delete, launch, and favorite actions performed by the authenticated user."
            )
            .Produces<IReadOnlyList<RecentActionResponse>>(
                StatusCodes.Status200OK
            )
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapPost("/", RecordActivityAsync)
            .WithName("RecordActivity")
            .WithSummary("Record a portal activity")
            .WithDescription(
                "Records an activity entry for the authenticated user and keeps the newest one hundred entries."
            )
            .Produces<RecordActivityResponse>(
                StatusCodes.Status201Created
            )
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapDelete("/{activityId:long}", DeleteActivityAsync)
            .WithName("DeleteActivity")
            .WithSummary("Delete one activity entry")
            .WithDescription(
                "Deletes a single activity entry that belongs to the authenticated user."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/", ClearActivitiesAsync)
            .WithName("ClearActivities")
            .WithSummary("Clear all activity entries")
            .WithDescription(
                "Deletes every activity entry that belongs to the authenticated user."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        return endpoints;
    }

    private static async Task<IResult> GetActivitiesAsync(
        HttpContext httpContext,
        SessionService sessionService,
        GetActivitiesService getActivitiesService,
        CancellationToken cancellationToken,
        int take = 20)
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

        var activities = await getActivitiesService.GetAsync(
            user.UserId,
            take,
            cancellationToken
        );

        return Results.Ok(activities);
    }

    private static async Task<IResult> GetRecentActionsAsync(
        HttpContext httpContext,
        SessionService sessionService,
        GetRecentActionsService getRecentActionsService,
        int? take,
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

        return Results.Ok(
            await getRecentActionsService.GetAsync(
                user.UserId,
                take ?? 10,
                cancellationToken
            )
        );
    }

    private static async Task<IResult> RecordActivityAsync(
        RecordActivityRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        RecordActivityService recordActivityService,
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

        var activityId = await recordActivityService.RecordAsync(
            user.UserId,
            request,
            cancellationToken
        );

        if (activityId is null)
        {
            return Results.BadRequest();
        }

        return Results.Created(
            $"/api/activities/{activityId.Value}",
            new RecordActivityResponse(activityId.Value)
        );
    }

    private static async Task<IResult> DeleteActivityAsync(
        long activityId,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        DeleteActivityService deleteActivityService,
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

        var deleted = await deleteActivityService.DeleteAsync(
            user.UserId,
            activityId,
            cancellationToken
        );

        if (!deleted)
        {
            return Results.NotFound();
        }

        return Results.NoContent();
    }

    private static async Task<IResult> ClearActivitiesAsync(
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        ClearActivitiesService clearActivitiesService,
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

        await clearActivitiesService.ClearAsync(
            user.UserId,
            cancellationToken
        );

        return Results.NoContent();
    }
}
