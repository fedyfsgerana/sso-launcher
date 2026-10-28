#nullable enable

using SsoLauncher.Api.Authorization;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Applications.GetApplicationCatalog;
using SsoLauncher.Application.Auth.Session;
using SsoLauncher.Application.Common.Paging;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Application.UserGroups.DeleteUserGroup;
using SsoLauncher.Application.UserGroups.DuplicateUserGroup;
using SsoLauncher.Application.UserGroups.GetUserGroupDetail;
using SsoLauncher.Application.UserGroups.GetUserGroups;
using SsoLauncher.Application.UserGroups.GroupNames;
using SsoLauncher.Application.UserGroups.ManageAccess;
using SsoLauncher.Application.UserGroups.ManageMembers;
using SsoLauncher.Application.UserGroups.ManageMenuAccess;
using SsoLauncher.Application.UserGroups.SaveUserGroup;
using SsoLauncher.Application.Users.GetUsers;

namespace SsoLauncher.Api.Endpoints;

public static class UserGroupEndpoints
{
    public static IEndpointRouteBuilder MapUserGroupEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints
            .MapGroup("/api/admin/groups")
            .WithTags("User Groups");

        group.MapGet("/summary", GetGroupsSummaryAsync)
            .WithName("GetUserGroupsSummary")
            .WithSummary("Get user group counts")
            .WithDescription(
                "Returns the number of user groups in total, active, inactive, and without members. Requires an authenticated administrator."
            )
            .Produces<UserGroupSummaryResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapGet("/page", GetGroupsPageAsync)
            .WithName("GetUserGroupsPage")
            .WithSummary("Get a page of user groups")
            .WithDescription(
                "Returns one page of user groups with search, filters, and sorting applied on the server. Requires an authenticated administrator."
            )
            .Produces<PagedResponse<UserGroupResponse>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapGet("/", GetGroupsAsync)
            .WithName("GetUserGroups")
            .WithSummary("Get all user groups")
            .WithDescription(
                "Returns every user group with its member and application counts."
            )
            .Produces<IReadOnlyList<UserGroupResponse>>(
                StatusCodes.Status200OK
            )
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapGet("/name-options", GetNameOptionsAsync)
            .WithName("GetGroupNameOptions")
            .WithSummary("Get suggested group names for a department")
            .WithDescription(
                "Returns the job titles of saved users in the given department as suggested group names. Each option carries the id of the group that already uses it, if any. Group names may also be typed freely, as long as they are unique within the department."
            )
            .Produces<IReadOnlyList<GroupNameOption>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapGet("/application-options", GetApplicationOptionsAsync)
            .WithName("GetGroupApplicationOptions")
            .WithSummary("Get applications that can be granted to a group")
            .WithDescription(
                "Returns every application that is not inactive, for choosing the applications a group can open."
            )
            .Produces<IReadOnlyList<ApplicationCatalogItemResponse>>(
                StatusCodes.Status200OK
            )
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapGet("/{groupId:long}/user-options/page", GetUserOptionsPageAsync)
            .WithName("GetGroupUserOptionsPage")
            .WithSummary("Get a page of users that can be added to a group")
            .WithDescription(
                "Returns one page of users in the group's department. View \"members\" limits the list to current members and \"others\" to users outside the group."
            )
            .Produces<PagedResponse<UserResponse>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapGet("/{groupId:long}/user-options", GetUserOptionsAsync)
            .WithName("GetGroupUserOptions")
            .WithSummary("Get users that can be added to a group")
            .WithDescription(
                "Returns the portal users in the group's department, for choosing the members of a group."
            )
            .Produces<IEnumerable<UserResponse>>(
                StatusCodes.Status200OK
            )
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapGet("/{groupId:long}", GetGroupAsync)
            .WithName("GetUserGroupDetail")
            .WithSummary("Get one user group with members and access")
            .WithDescription(
                "Returns the members of a group and the applications the group can open."
            )
            .Produces<UserGroupDetailResponse>(
                StatusCodes.Status200OK
            )
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", CreateGroupAsync)
            .WithName("CreateUserGroup")
            .WithSummary("Create a user group")
            .WithDescription(
                "Creates a user group. Requires an administrator and a valid CSRF token."
            )
            .Produces<CreateUserGroupResponse>(
                StatusCodes.Status201Created
            )
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapPut("/{groupId:long}", UpdateGroupAsync)
            .WithName("UpdateUserGroup")
            .WithSummary("Update a user group")
            .WithDescription(
                "Updates the name, description, or status of a user group."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapDelete("/{groupId:long}", DeleteGroupAsync)
            .WithName("DeleteUserGroup")
            .WithSummary("Delete a user group")
            .WithDescription(
                "Deletes a user group together with its members and access mapping."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPut("/{groupId:long}/members", SetMembersAsync)
            .WithName("SetUserGroupMembers")
            .WithSummary("Replace the members of a group")
            .WithDescription(
                "Replaces the member list of one group with the given user ids."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapPut("/{groupId:long}/access", SetAccessAsync)
            .WithName("SetUserGroupAccess")
            .WithSummary("Replace the application access of a group")
            .WithDescription(
                "Replaces the applications granted through one group."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapPut("/{groupId:long}/menus", SetMenuAccessAsync)
            .WithName("SetUserGroupMenuAccess")
            .WithSummary("Replace the sidebar menus granted to a group")
            .WithDescription(
                "Replaces the portal menus that members of one group can see in the sidebar."
            )
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapPost("/{groupId:long}/members/add", AddMembersAsync)
            .WithName("AddUserGroupMembers")
            .WithSummary("Add users to a group")
            .WithDescription(
                "Adds the given users to one group without removing existing members."
            )
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{groupId:long}/duplicate", DuplicateGroupAsync)
            .WithName("DuplicateUserGroup")
            .WithSummary("Duplicate a user group")
            .WithDescription(
                "Creates a new group with the same description, status, application access, and menu access. Members are not copied."
            )
            .Produces<CreateUserGroupResponse>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        return endpoints;
    }

    private static async Task<IResult> SetMenuAccessAsync(
        long groupId,
        SetGroupMenuAccessRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        SetGroupMenuAccessService setGroupMenuAccessService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            csrfTokenService,
            cancellationToken,
            MenuActions.ManageAccess
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var saved = await setGroupMenuAccessService.SetAsync(
            groupId,
            request,
            actor.UserId,
            actor.Name,
            cancellationToken
        );

        return saved
            ? Results.NoContent()
            : Results.BadRequest();
    }

    private static async Task<IResult> GetGroupsAsync(
        HttpContext httpContext,
        SessionService sessionService,
        GetUserGroupsService getUserGroupsService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            null,
            cancellationToken
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var groups = await getUserGroupsService.GetAsync(cancellationToken);

        return Results.Ok(groups);
    }

    private static async Task<IResult> GetGroupsSummaryAsync(
        HttpContext httpContext,
        SessionService sessionService,
        GetUserGroupsService getUserGroupsService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            null,
            cancellationToken
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var summary = await getUserGroupsService.GetSummaryAsync(cancellationToken);

        return Results.Ok(summary);
    }

    private static async Task<IResult> GetGroupsPageAsync(
        [AsParameters] UserGroupPageRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        GetUserGroupsService getUserGroupsService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            null,
            cancellationToken
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var page = await getUserGroupsService.GetPageAsync(request, cancellationToken);

        return Results.Ok(page);
    }

    private static async Task<IResult> GetNameOptionsAsync(
        string? departmentCode,
        HttpContext httpContext,
        SessionService sessionService,
        GroupNameOptionsService groupNameOptions,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            null,
            cancellationToken
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var options = await groupNameOptions.GetAsync(
            departmentCode,
            cancellationToken
        );

        return Results.Ok(options);
    }

    private static async Task<IResult> GetApplicationOptionsAsync(
        HttpContext httpContext,
        SessionService sessionService,
        GetApplicationCatalogService catalogService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            null,
            cancellationToken
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var applications = await catalogService.GetAsync(cancellationToken);

        return Results.Ok(applications);
    }

    private static async Task<IResult> GetUserOptionsAsync(
        long groupId,
        HttpContext httpContext,
        SessionService sessionService,
        GetUsersService getUsersService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            null,
            cancellationToken
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var users = await getUsersService.GetForGroupAsync(
            groupId,
            cancellationToken
        );

        return users is null
            ? Results.NotFound()
            : Results.Ok(users);
    }

    private static async Task<IResult> GetUserOptionsPageAsync(
        long groupId,
        [AsParameters] GroupUserOptionsRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        GetUsersService getUsersService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            null,
            cancellationToken
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var page = await getUsersService.GetGroupOptionsPageAsync(
            groupId,
            request,
            cancellationToken
        );

        return page is null
            ? Results.NotFound()
            : Results.Ok(page);
    }

    private static async Task<IResult> GetGroupAsync(
        long groupId,
        HttpContext httpContext,
        SessionService sessionService,
        GetUserGroupDetailService getUserGroupDetailService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            null,
            cancellationToken
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var detail = await getUserGroupDetailService.GetAsync(
            groupId,
            cancellationToken
        );

        return detail is null
            ? Results.NotFound()
            : Results.Ok(detail);
    }

    private static async Task<IResult> CreateGroupAsync(
        SaveUserGroupRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        CreateUserGroupService createUserGroupService,
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

        var groupId = await createUserGroupService.CreateAsync(
            request,
            actor.UserId,
            actor.Name,
            cancellationToken
        );

        if (groupId is null)
        {
            return Results.BadRequest();
        }

        return Results.Created(
            $"/api/admin/groups/{groupId.Value}",
            new CreateUserGroupResponse(groupId.Value)
        );
    }

    private static async Task<IResult> UpdateGroupAsync(
        long groupId,
        SaveUserGroupRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        UpdateUserGroupService updateUserGroupService,
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

        var updated = await updateUserGroupService.UpdateAsync(
            groupId,
            request,
            actor.UserId,
            actor.Name,
            cancellationToken
        );

        return updated
            ? Results.NoContent()
            : Results.BadRequest();
    }

    private static async Task<IResult> DeleteGroupAsync(
        long groupId,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        DeleteUserGroupService deleteUserGroupService,
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

        var deleted = await deleteUserGroupService.DeleteAsync(
            groupId,
            actor.UserId,
            actor.Name,
            cancellationToken
        );

        return deleted
            ? Results.NoContent()
            : Results.NotFound();
    }

    private static async Task<IResult> SetMembersAsync(
        long groupId,
        SetGroupMembersRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        SetGroupMembersService setGroupMembersService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            csrfTokenService,
            cancellationToken,
            MenuActions.ManageMembers
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var saved = await setGroupMembersService.SetAsync(
            groupId,
            request,
            actor.UserId,
            actor.Name,
            cancellationToken
        );

        return saved
            ? Results.NoContent()
            : Results.BadRequest();
    }

    private static async Task<IResult> SetAccessAsync(
        long groupId,
        SetGroupAccessRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        SetGroupAccessService setGroupAccessService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            csrfTokenService,
            cancellationToken,
            MenuActions.ManageAccess
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var saved = await setGroupAccessService.SetAsync(
            groupId,
            request,
            actor.UserId,
            actor.Name,
            cancellationToken
        );

        return saved
            ? Results.NoContent()
            : Results.BadRequest();
    }

    private static async Task<IResult> AddMembersAsync(
        long groupId,
        SetGroupMembersRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        AddGroupMembersService addGroupMembersService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            csrfTokenService,
            cancellationToken,
            MenuActions.ManageMembers
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var added = await addGroupMembersService.AddAsync(
            groupId,
            request,
            actor.UserId,
            actor.Name,
            cancellationToken
        );

        return added is null
            ? Results.NotFound()
            : Results.Ok(new { added = added.Value });
    }

    private static async Task<IResult> DuplicateGroupAsync(
        long groupId,
        DuplicateUserGroupRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        DuplicateUserGroupService duplicateUserGroupService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardAsync(
            httpContext,
            sessionService,
            csrfTokenService,
            cancellationToken,
            MenuActions.Duplicate
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var copyId = await duplicateUserGroupService.DuplicateAsync(
            groupId,
            request,
            actor.UserId,
            actor.Name,
            cancellationToken
        );

        return copyId is null
            ? Results.BadRequest()
            : Results.Created(
                $"/api/admin/groups/{copyId.Value}",
                new CreateUserGroupResponse(copyId.Value)
            );
    }

    private static async Task<(IResult? Result, SessionUser? Actor)> GuardAsync(
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService? csrfTokenService,
        CancellationToken cancellationToken,
        string? actionKey = null)
    {
        var authorization = actionKey is null
            ? await PortalAuthorization.AuthorizeMenuAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Groups,
                cancellationToken
            )
            : await PortalAuthorization.AuthorizeActionAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Groups,
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

        if (csrfTokenService is not null &&
            !PortalCsrf.Validate(httpContext, csrfTokenService))
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
