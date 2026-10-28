using SsoLauncher.Api.Authorization;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Auth.Session;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Application.DataHistory;

namespace SsoLauncher.Api.Endpoints;

public static class DataVersionEndpoints
{
    public static IEndpointRouteBuilder MapDataVersionEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints
            .MapGroup("/api/admin/versions")
            .WithTags("Data Versions");

        group.MapGet("/{entityType}/{entityId:long}", GetVersionsAsync)
            .WithName("GetDataVersions")
            .WithSummary("Get every stored version of one record")
            .WithDescription(
                "Returns all versions of one record, newest first, with the full snapshot and the fields that changed compared with the previous version. Requires access to the activity history menu."
            )
            .Produces<IReadOnlyList<DataVersionResponse>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{entityType}/{entityId:long}/rollback", RollbackAsync)
            .WithName("RollbackDataVersion")
            .WithSummary("Roll a record back to one of its versions")
            .WithDescription(
                "Restores the record, including its relations, to the chosen version. The rollback is stored as a new version, so no history is lost. Requires access to the activity history menu, a reason, and a valid CSRF token."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict);

        return endpoints;
    }

    private static async Task<IResult> GetVersionsAsync(
        string entityType,
        long entityId,
        HttpContext httpContext,
        SessionService sessionService,
        GetDataVersionsService service,
        CancellationToken cancellationToken)
    {
        var authorization = await PortalAuthorization.AuthorizeMenuAsync(
            httpContext,
            sessionService,
            PortalMenuTargets.Audit,
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

        if (!VersionedEntityTypes.CanView(entityType))
        {
            return Results.NotFound();
        }

        return Results.Ok(
            await service.GetAsync(entityType, entityId, cancellationToken)
        );
    }

    private static async Task<IResult> RollbackAsync(
        string entityType,
        long entityId,
        RollbackRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        RollbackService service,
        CancellationToken cancellationToken)
    {
        var authorization = await PortalAuthorization.AuthorizeActionAsync(
            httpContext,
            sessionService,
            PortalMenuTargets.Audit,
            MenuActions.Rollback,
            cancellationToken
        );

        if (!authorization.IsAuthenticated)
        {
            return Results.Unauthorized();
        }

        if (!authorization.IsAuthorized ||
            authorization.User is null ||
            !PortalCsrf.Validate(httpContext, csrfTokenService))
        {
            return Results.StatusCode(StatusCodes.Status403Forbidden);
        }

        if (!VersionedEntityTypes.CanRollback(entityType))
        {
            return Results.NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return Results.BadRequest(new { error = "reason_required" });
        }

        var result = await service.RollbackAsync(
            entityType,
            entityId,
            request,
            authorization.User.UserId,
            authorization.User.Name,
            cancellationToken
        );

        return result switch
        {
            RollbackResult.RolledBack => Results.NoContent(),
            RollbackResult.Conflict => Results.Conflict(
                new { error = "conflict" }
            ),
            RollbackResult.DeletedVersion => Results.BadRequest(
                new { error = "deleted_version" }
            ),
            RollbackResult.Unsupported => Results.BadRequest(
                new { error = "unsupported" }
            ),
            _ => Results.NotFound()
        };
    }
}
