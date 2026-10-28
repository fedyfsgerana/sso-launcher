using SsoLauncher.Api.Authorization;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Auth.Session;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Application.RecycleBin;

namespace SsoLauncher.Api.Endpoints;

public static class RecycleBinEndpoints
{
    public static IEndpointRouteBuilder MapRecycleBinEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints
            .MapGroup("/api/admin/recycle-bin")
            .WithTags("Recycle Bin");

        group.MapGet("/{entityType}", GetDeletedRecordsAsync)
            .WithName("GetDeletedRecords")
            .WithSummary("Get deleted records of one type")
            .WithDescription(
                "Returns soft-deleted records with who deleted them, when, and why. Supported types: user, application, user_group, portal_menu, application_menu, access. Requires access to the activity history menu."
            )
            .Produces<IReadOnlyList<DeletedItemResponse>>(
                StatusCodes.Status200OK
            )
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{entityType}/{id:long}/restore", RestoreRecordAsync)
            .WithName("RestoreRecord")
            .WithSummary("Restore a deleted record")
            .WithDescription(
                "Restores one soft-deleted record and records the restore with before and after snapshots. Requires access to the activity history menu and a valid CSRF token."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict);

        return endpoints;
    }

    private static async Task<IResult> GetDeletedRecordsAsync(
        string entityType,
        HttpContext httpContext,
        SessionService sessionService,
        GetDeletedRecordsService service,
        CancellationToken cancellationToken)
    {
        var (guard, _) = await GuardAsync(
            httpContext,
            sessionService,
            null,
            cancellationToken
        );

        if (guard is not null)
        {
            return guard;
        }

        if (!RecycleBinTypes.IsSupported(entityType))
        {
            return Results.NotFound();
        }

        var items = await service.GetAsync(entityType, cancellationToken);

        return items is null
            ? Results.NotFound()
            : Results.Ok(items);
    }

    private static async Task<IResult> RestoreRecordAsync(
        string entityType,
        long id,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        RestoreRecordService service,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            csrfTokenService,
            cancellationToken
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        if (!RecycleBinTypes.IsSupported(entityType))
        {
            return Results.NotFound();
        }

        var result = await service.RestoreAsync(
            entityType,
            id,
            actor.UserId,
            actor.Name,
            cancellationToken
        );

        return result switch
        {
            RestoreResult.Restored => Results.NoContent(),
            RestoreResult.Conflict => Results.Conflict(),
            _ => Results.NotFound()
        };
    }

    private static async Task<(IResult? Result, SessionUser? Actor)> GuardAsync(
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService? csrfTokenService,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeActionAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Audit,
                MenuActions.Restore,
                cancellationToken
            );

        if (!authorization.IsAuthenticated)
        {
            return (Results.Unauthorized(), null);
        }

        if (!authorization.IsAuthorized || authorization.User is null)
        {
            return (
                Results.StatusCode(StatusCodes.Status403Forbidden),
                null
            );
        }

        if (csrfTokenService is not null &&
            !PortalCsrf.Validate(httpContext, csrfTokenService))
        {
            return (
                Results.StatusCode(StatusCodes.Status403Forbidden),
                null
            );
        }

        return (null, authorization.User);
    }
}
