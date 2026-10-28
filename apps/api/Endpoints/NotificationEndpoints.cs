using SsoLauncher.Api.Authorization;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Auth.Session;
using SsoLauncher.Application.Notifications;

namespace SsoLauncher.Api.Endpoints;

public static class NotificationEndpoints
{
    public static IEndpointRouteBuilder MapNotificationEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints
            .MapGroup("/api/notifications")
            .WithTags("Notifications");

        group.MapGet("/", GetNotificationsAsync)
            .WithName("GetNotifications")
            .WithSummary("Get notifications of the current user")
            .WithDescription(
                "Returns up to 20 notifications from the last 30 days for the signed-in user, with the number of unread notifications."
            )
            .Produces<NotificationListResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized);

        group.MapPost("/read", MarkAllReadAsync)
            .WithName("MarkNotificationsRead")
            .WithSummary("Mark all notifications as read")
            .WithDescription(
                "Marks every unread notification of the signed-in user as read."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapDelete("/{notificationId:long}", DeleteNotificationAsync)
            .WithName("DeleteNotification")
            .WithSummary("Delete one notification of the current user")
            .WithDescription(
                "Removes one notification of the signed-in user. Requires a valid CSRF token."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/", ClearNotificationsAsync)
            .WithName("ClearNotifications")
            .WithSummary("Delete every notification of the current user")
            .WithDescription(
                "Removes every notification of the signed-in user. Requires a valid CSRF token."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        return endpoints;
    }

    private static async Task<IResult> DeleteNotificationAsync(
        long notificationId,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        NotificationService notificationService,
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

        if (!PortalCsrf.Validate(httpContext, csrfTokenService))
        {
            return Results.StatusCode(StatusCodes.Status403Forbidden);
        }

        var removed = await notificationService.DeleteAsync(
            user.UserId,
            notificationId,
            cancellationToken
        );

        return removed ? Results.NoContent() : Results.NotFound();
    }

    private static async Task<IResult> ClearNotificationsAsync(
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        NotificationService notificationService,
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

        if (!PortalCsrf.Validate(httpContext, csrfTokenService))
        {
            return Results.StatusCode(StatusCodes.Status403Forbidden);
        }

        await notificationService.ClearAsync(user.UserId, cancellationToken);

        return Results.NoContent();
    }

    private static async Task<IResult> GetNotificationsAsync(
        HttpContext httpContext,
        SessionService sessionService,
        NotificationService notificationService,
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
            await notificationService.GetAsync(user.UserId, cancellationToken)
        );
    }

    private static async Task<IResult> MarkAllReadAsync(
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        NotificationService notificationService,
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

        if (!PortalCsrf.Validate(httpContext, csrfTokenService))
        {
            return Results.StatusCode(StatusCodes.Status403Forbidden);
        }

        await notificationService.MarkAllReadAsync(user.UserId, cancellationToken);

        return Results.NoContent();
    }
}
