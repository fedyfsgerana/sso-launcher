#nullable enable

using SsoLauncher.Api.Authorization;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Auth.Session;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Application.PortalMenus.CreatePortalMenu;
using SsoLauncher.Application.PortalMenus.DeletePortalMenu;
using SsoLauncher.Application.PortalMenus.GetMyMenus;
using SsoLauncher.Application.PortalMenus.GetPortalMenus;
using SsoLauncher.Application.PortalMenus.ReorderPortalMenus;
using SsoLauncher.Application.PortalMenus.SetMenuGroups;
using SsoLauncher.Application.PortalMenus.SetMenuMaintenance;
using SsoLauncher.Application.PortalMenus.UpdatePortalMenu;

namespace SsoLauncher.Api.Endpoints;

public static class PortalMenuEndpoints
{
    public static IEndpointRouteBuilder MapPortalMenuEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/menus/me", GetMyMenusAsync)
            .WithName("GetMyMenus")
            .WithTags("Portal Menus")
            .WithSummary("Get sidebar menus for the current user")
            .WithDescription(
                "Returns active SSO Launcher sidebar menus, ordered by section and sort order."
            )
            .Produces<IReadOnlyList<MyMenuResponse>>(
                StatusCodes.Status200OK
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            );

        var group = endpoints
            .MapGroup("/api/admin/menus")
            .WithTags("Portal Menus Management");

        group.MapGet("/", GetMenusAsync)
            .WithName("GetPortalMenus")
            .WithSummary("Get all portal menus")
            .WithDescription(
                "Returns every portal menu. Requires an authenticated super administrator."
            )
            .Produces<IReadOnlyList<PortalMenuResponse>>(
                StatusCodes.Status200OK
            )
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapPost("/", CreateMenuAsync)
            .WithName("CreatePortalMenu")
            .WithSummary("Create a portal menu")
            .WithDescription(
                "Creates a new sidebar menu. Requires an authenticated super administrator and a valid CSRF token."
            )
            .Produces<CreatePortalMenuResponse>(
                StatusCodes.Status201Created
            )
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapPut("/{menuId:long}", UpdateMenuAsync)
            .WithName("UpdatePortalMenu")
            .WithSummary("Update a portal menu")
            .WithDescription(
                "Updates a sidebar menu. System menus keep their target and section."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/{menuId:long}", DeleteMenuAsync)
            .WithName("DeletePortalMenu")
            .WithSummary("Delete a portal menu")
            .WithDescription(
                "Deletes a sidebar menu. System pages cannot be deleted. Child menus are moved to the menu or section given in moveTo. A section that still has menus requires moveTo, and a menu without moveTo moves its submenus up one level."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict);

        group.MapPut("/reorder", ReorderMenusAsync)
            .WithName("ReorderPortalMenus")
            .WithSummary("Reorder portal menus in a section")
            .WithDescription(
                "Applies menu hierarchy and sort order for one section."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapPut("/{menuId:long}/groups", SetMenuGroupsAsync)
            .WithName("SetPortalMenuGroups")
            .WithSummary("Replace the groups that can see a menu")
            .WithDescription(
                "Replaces the user groups whose members can see one sidebar menu."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapGet("/actions", GetMenuActionCatalogAsync)
            .WithName("GetMenuActionCatalog")
            .WithSummary("Get the action catalog of portal menus")
            .WithDescription(
                "Returns the actions that can be granted per menu, defined in the portal code."
            )
            .Produces<IReadOnlyList<MenuActionDefinition>>(
                StatusCodes.Status200OK
            )
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapPut("/{menuId:long}/maintenance", SetMenuMaintenanceAsync)
            .WithName("SetPortalMenuMaintenance")
            .WithSummary("Set the maintenance mode of one menu")
            .WithDescription(
                "Turns maintenance mode on or off for one sidebar menu, with the title and message shown to users."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static async Task<IResult> GetMenuActionCatalogAsync(
        HttpContext httpContext,
        SessionService sessionService,
        CancellationToken cancellationToken)
    {
        var authorization = await PortalAuthorization.AuthorizeMenuAsync(
            httpContext,
            sessionService,
            PortalMenuTargets.Groups,
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

        return Results.Ok(MenuActions.Catalog);
    }

    private static async Task<IResult> SetMenuMaintenanceAsync(
        long menuId,
        SetMenuMaintenanceRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        SetMenuMaintenanceService setMenuMaintenanceService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            csrfTokenService,
            cancellationToken,
            MenuActions.Maintenance
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var result = await setMenuMaintenanceService.SetAsync(
            menuId,
            request,
            actor.UserId,
            actor.Name,
            cancellationToken
        );

        return result switch
        {
            SetMenuMaintenanceResult.Updated => Results.NoContent(),
            SetMenuMaintenanceResult.NotFound => Results.NotFound(),
            _ => Results.BadRequest()
        };
    }

    private static async Task<IResult> GetMyMenusAsync(
        HttpContext httpContext,
        SessionService sessionService,
        GetMyMenusService getMyMenusService,
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

        var menus = await getMyMenusService.GetAsync(
            user.UserId,
            cancellationToken
        );

        return Results.Ok(menus);
    }

    private static async Task<IResult> GetMenusAsync(
        HttpContext httpContext,
        SessionService sessionService,
        GetPortalMenusService getPortalMenusService,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeMenuAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Menus,
                cancellationToken
            );

        if (!authorization.IsAuthenticated)
        {
            return Results.Unauthorized();
        }

        if (!authorization.IsAuthorized)
        {
            return Results.StatusCode(
                StatusCodes.Status403Forbidden
            );
        }

        var menus = await getPortalMenusService.GetAsync(
            cancellationToken
        );

        return Results.Ok(menus);
    }

    private static async Task<IResult> CreateMenuAsync(
        CreatePortalMenuRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        CreatePortalMenuService createPortalMenuService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            csrfTokenService,
            cancellationToken,
            MenuActions.Create
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var menuId = await createPortalMenuService.CreateAsync(
            request,
            actor.UserId,
            actor.Name,
            cancellationToken
        );

        if (menuId is null)
        {
            return Results.BadRequest();
        }

        return Results.Created(
            $"/api/admin/menus/{menuId.Value}",
            new CreatePortalMenuResponse(menuId.Value)
        );
    }

    private static async Task<IResult> UpdateMenuAsync(
        long menuId,
        UpdatePortalMenuRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        UpdatePortalMenuService updatePortalMenuService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            csrfTokenService,
            cancellationToken,
            MenuActions.Update
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var result = await updatePortalMenuService.UpdateAsync(
            menuId,
            request,
            actor.UserId,
            actor.Name,
            cancellationToken
        );

        return result switch
        {
            UpdatePortalMenuResult.Updated => Results.NoContent(),
            UpdatePortalMenuResult.NotFound => Results.NotFound(),
            _ => Results.BadRequest()
        };
    }

    private static async Task<IResult> DeleteMenuAsync(
        long menuId,
        long? moveTo,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        DeletePortalMenuService deletePortalMenuService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            csrfTokenService,
            cancellationToken,
            MenuActions.Delete
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var result = await deletePortalMenuService.DeleteAsync(
            menuId,
            actor.UserId,
            actor.Name,
            moveTo,
            cancellationToken
        );

        return result switch
        {
            DeletePortalMenuResult.Deleted => Results.NoContent(),
            DeletePortalMenuResult.NotFound => Results.NotFound(),
            DeletePortalMenuResult.HasChildren => Results.Conflict(),
            DeletePortalMenuResult.InvalidTarget => Results.BadRequest(),
            _ => Results.StatusCode(
                StatusCodes.Status403Forbidden
            )
        };
    }

    private static async Task<IResult> ReorderMenusAsync(
        ReorderPortalMenusRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        ReorderPortalMenusService reorderPortalMenusService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            csrfTokenService,
            cancellationToken,
            MenuActions.Reorder
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var reordered = await reorderPortalMenusService.ReorderAsync(
            request,
            actor.UserId,
            actor.Name,
            cancellationToken
        );

        if (!reordered)
        {
            return Results.BadRequest();
        }

        return Results.NoContent();
    }

    private static async Task<IResult> SetMenuGroupsAsync(
        long menuId,
        SetMenuGroupsRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        SetMenuGroupsService setMenuGroupsService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            csrfTokenService,
            cancellationToken,
            MenuActions.Update
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var saved = await setMenuGroupsService.SetAsync(
            menuId,
            request,
            actor.UserId,
            actor.Name,
            cancellationToken
        );

        return saved
            ? Results.NoContent()
            : Results.BadRequest();
    }

    private static async Task<(IResult? Result, SessionUser? Actor)> GuardAsync(
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        CancellationToken cancellationToken,
        string? actionKey = null)
    {
        var authorization = actionKey is null
            ? await PortalAuthorization.AuthorizeMenuAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Menus,
                cancellationToken
            )
            : await PortalAuthorization.AuthorizeActionAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Menus,
                actionKey,
                cancellationToken
            );

        if (!authorization.IsAuthenticated)
        {
            return (Results.Unauthorized(), null);
        }

        if (!authorization.IsAuthorized || authorization.User is null)
        {
            return (
                Results.StatusCode(
                    StatusCodes.Status403Forbidden
                ),
                null
            );
        }

        if (!PortalCsrf.Validate(
                httpContext,
                csrfTokenService))
        {
            return (
                Results.StatusCode(
                    StatusCodes.Status403Forbidden
                ),
                null
            );
        }

        return (null, authorization.User);
    }
}
