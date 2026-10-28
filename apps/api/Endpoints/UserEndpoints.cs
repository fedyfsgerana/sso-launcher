#nullable enable

using SsoLauncher.Api.Authorization;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Auth.Login;
using SsoLauncher.Application.Auth.Session;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Application.Users.CreateUser;
using SsoLauncher.Application.Users.DeleteUser;
using SsoLauncher.Application.Users.Security;
using SsoLauncher.Application.Common.Paging;
using SsoLauncher.Application.Users.GetUsers;
using SsoLauncher.Application.Users.UpdateUser;

namespace SsoLauncher.Api.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints
            .MapGroup("/api/admin/users")
            .WithTags("Users");

        group.MapGet("/", GetUsersAsync)
            .WithName("GetUsers")
            .WithSummary("Get all portal users")
            .WithDescription(
                "Returns all SSO Launcher users. Requires an authenticated administrator."
            )
            .Produces<IEnumerable<UserResponse>>(
                StatusCodes.Status200OK
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            )
            .Produces(
                StatusCodes.Status403Forbidden
            );

        group.MapGet("/page", GetUsersPageAsync)
            .WithName("GetUsersPage")
            .WithSummary("Get a page of portal users")
            .WithDescription(
                "Returns one page of SSO Launcher users with search, filters, and sorting applied on the server. Requires an authenticated administrator."
            )
            .Produces<PagedResponse<UserResponse>>(
                StatusCodes.Status200OK
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            )
            .Produces(
                StatusCodes.Status403Forbidden
            );

        group.MapGet("/summary", GetUserSummaryAsync)
            .WithName("GetUserSummary")
            .WithSummary("Get portal user counts")
            .WithDescription(
                "Returns the number of portal users in total, active, and inactive. Requires an authenticated administrator."
            )
            .Produces<UserSummaryResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapGet("/{userId:long}", GetUserAsync)
            .WithName("GetUser")
            .WithSummary("Get a portal user")
            .WithDescription(
                "Returns one SSO Launcher user with their groups. Requires an authenticated administrator."
            )
            .Produces<UserResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", CreateUserAsync)
            .WithName("CreateUser")
            .WithSummary("Create a portal user")
            .WithDescription(
                "Creates a new SSO Launcher user. Requires an authenticated administrator and a valid CSRF token."
            )
            .Produces(
                StatusCodes.Status200OK
            )
            .Produces(
                StatusCodes.Status400BadRequest
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            )
            .Produces(
                StatusCodes.Status403Forbidden
            );

        group.MapPut("/{userId:long}", UpdateUserAsync)
            .WithName("UpdateUser")
            .WithSummary("Update a portal user")
            .WithDescription(
                "Updates an existing SSO Launcher user. Requires an authenticated administrator and a valid CSRF token."
            )
            .Produces(
                StatusCodes.Status204NoContent
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            )
            .Produces(
                StatusCodes.Status403Forbidden
            )
            .Produces(
                StatusCodes.Status404NotFound
            );

        group.MapDelete("/{userId:long}", DeleteUserAsync)
            .WithName("DeleteUser")
            .WithSummary("Move a portal user to the recycle bin")
            .WithDescription(
                "Soft deletes a user, deactivates the account, and revokes every session. Requires an authenticated administrator and a valid CSRF token."
            )
            .Produces(
                StatusCodes.Status204NoContent
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            )
            .Produces(
                StatusCodes.Status403Forbidden
            )
            .Produces(
                StatusCodes.Status404NotFound
            )
            .Produces(
                StatusCodes.Status409Conflict
            );

        group.MapPost("/{userId:long}/reset-password", ResetPasswordAsync)
            .WithName("ResetUserPassword")
            .WithSummary("Reset the password of one user")
            .WithDescription(
                "Sets a new password for the user and revokes every session. Requires an authenticated administrator and a valid CSRF token."
            )
            .Produces(
                StatusCodes.Status204NoContent
            )
            .Produces(
                StatusCodes.Status400BadRequest
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            )
            .Produces(
                StatusCodes.Status403Forbidden
            )
            .Produces(
                StatusCodes.Status404NotFound
            );

        group.MapPost("/{userId:long}/revoke-sessions", RevokeSessionsAsync)
            .WithName("RevokeUserSessions")
            .WithSummary("Revoke every session of one user")
            .WithDescription(
                "Signs the user out of every device. Requires an authenticated administrator and a valid CSRF token."
            )
            .Produces(
                StatusCodes.Status200OK
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            )
            .Produces(
                StatusCodes.Status403Forbidden
            )
            .Produces(
                StatusCodes.Status404NotFound
            );

        group.MapGet("/{userId:long}/login-lock", GetLoginLockAsync)
            .WithName("GetUserLoginLock")
            .WithSummary("Get the login lock status of one user")
            .WithDescription(
                "Returns whether the account is temporarily locked after failed login attempts."
            )
            .Produces(
                StatusCodes.Status200OK
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            )
            .Produces(
                StatusCodes.Status403Forbidden
            )
            .Produces(
                StatusCodes.Status404NotFound
            );

        group.MapPost("/{userId:long}/unlock-login", UnlockLoginAsync)
            .WithName("UnlockUserLogin")
            .WithSummary("Clear the login lock of one user")
            .WithDescription(
                "Clears the failed login attempts of the account. Requires an authenticated administrator and a valid CSRF token."
            )
            .Produces(
                StatusCodes.Status200OK
            )
            .Produces(
                StatusCodes.Status401Unauthorized
            )
            .Produces(
                StatusCodes.Status403Forbidden
            )
            .Produces(
                StatusCodes.Status404NotFound
            );

        return endpoints;
    }

    private static async Task<IResult> ResetPasswordAsync(
        long userId,
        ResetUserPasswordRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        UserSecurityService userSecurityService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardWriteAsync(
            httpContext,
            sessionService,
            csrfTokenService,
            MenuActions.ResetPassword,
            cancellationToken
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var reset = await userSecurityService.ResetPasswordAsync(
            userId,
            request,
            actor.UserId,
            actor.Name,
            cancellationToken
        );

        return reset
            ? Results.NoContent()
            : Results.BadRequest();
    }

    private static async Task<IResult> RevokeSessionsAsync(
        long userId,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        UserSecurityService userSecurityService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardWriteAsync(
            httpContext,
            sessionService,
            csrfTokenService,
            MenuActions.RevokeSessions,
            cancellationToken
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var revoked = await userSecurityService.RevokeSessionsAsync(
            userId,
            actor.UserId,
            actor.Name,
            cancellationToken
        );

        return revoked is null
            ? Results.NotFound()
            : Results.Ok(new RevokeSessionsResponse(revoked.Value));
    }

    private static async Task<IResult> GetLoginLockAsync(
        long userId,
        HttpContext httpContext,
        SessionService sessionService,
        UserSecurityService userSecurityService,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeMenuAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Users,
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

        var status = await userSecurityService.GetLoginLockAsync(
            userId,
            cancellationToken
        );

        return status is null
            ? Results.NotFound()
            : Results.Ok(status);
    }

    private static async Task<IResult> UnlockLoginAsync(
        long userId,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        UserSecurityService userSecurityService,
        CancellationToken cancellationToken)
    {
        var (guard, actor) = await GuardWriteAsync(
            httpContext,
            sessionService,
            csrfTokenService,
            MenuActions.RevokeSessions,
            cancellationToken
        );

        if (guard is not null || actor is null)
        {
            return guard ?? Results.Unauthorized();
        }

        var cleared = await userSecurityService.UnlockLoginAsync(
            userId,
            actor.UserId,
            actor.Name,
            cancellationToken
        );

        return cleared is null
            ? Results.NotFound()
            : Results.Ok(new UnlockLoginResponse(cleared.Value));
    }

    private static async Task<(IResult? Result, SessionUser? Actor)> GuardWriteAsync(
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        string actionKey,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeActionAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Users,
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
                Results.StatusCode(StatusCodes.Status403Forbidden),
                null
            );
        }

        if (!PortalCsrf.Validate(httpContext, csrfTokenService))
        {
            return (
                Results.StatusCode(StatusCodes.Status403Forbidden),
                null
            );
        }

        return (null, authorization.User);
    }

    private static async Task<IResult> DeleteUserAsync(
        long userId,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        DeleteUserService deleteUserService,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeActionAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Users,
                MenuActions.Delete,
                cancellationToken
            );

        if (!authorization.IsAuthenticated)
        {
            return Results.Unauthorized();
        }

        if (!authorization.IsAuthorized || authorization.User is null)
        {
            return Results.StatusCode(
                StatusCodes.Status403Forbidden
            );
        }

        if (!PortalCsrf.Validate(
                httpContext,
                csrfTokenService))
        {
            return Results.StatusCode(
                StatusCodes.Status403Forbidden
            );
        }

        var result =
            await deleteUserService.DeleteAsync(
                userId,
                authorization.User.UserId,
                authorization.User.Name,
                cancellationToken
            );

        return result switch
        {
            DeleteUserResult.Deleted => Results.NoContent(),
            DeleteUserResult.NotFound => Results.NotFound(),
            DeleteUserResult.SelfDelete => Results.Conflict(
                new { error = "self_delete" }
            ),
            _ => Results.BadRequest()
        };
    }

    private static async Task<IResult> GetUsersAsync(
        HttpContext httpContext,
        SessionService sessionService,
        GetUsersService getUsersService,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeMenuAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Users,
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

        var users =
            await getUsersService.GetAsync(
                cancellationToken
            );

        return Results.Ok(users);
    }

    private static async Task<IResult> GetUsersPageAsync(
        [AsParameters] UserPageRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        GetUsersService getUsersService,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeMenuAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Users,
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

        var page = await getUsersService.GetPageAsync(
            request,
            cancellationToken
        );

        return Results.Ok(page);
    }

    private static async Task<IResult> GetUserSummaryAsync(
        HttpContext httpContext,
        SessionService sessionService,
        GetUsersService getUsersService,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeMenuAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Users,
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

        var summary = await getUsersService.GetSummaryAsync(cancellationToken);

        return Results.Ok(summary);
    }

    private static async Task<IResult> GetUserAsync(
        long userId,
        HttpContext httpContext,
        SessionService sessionService,
        GetUsersService getUsersService,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeMenuAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Users,
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

        var user = await getUsersService.GetByIdAsync(userId, cancellationToken);

        return user is null
            ? Results.NotFound()
            : Results.Ok(user);
    }

    private static async Task<IResult> CreateUserAsync(
        CreateUserRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        CreateUserService createUserService,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeActionAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Users,
                MenuActions.Create,
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

        if (!PortalCsrf.Validate(
                httpContext,
                csrfTokenService))
        {
            return Results.StatusCode(
                StatusCodes.Status403Forbidden
            );
        }

        var result =
            await createUserService.CreateAsync(
                request,
                authorization.User!.UserId,
                authorization.User.Name,
                cancellationToken
            );

        return result is null
            ? Results.BadRequest()
            : Results.Ok(new CreateUserResponse(result.Value));
    }

    private static async Task<IResult> UpdateUserAsync(
        long userId,
        UpdateUserRequest request,
        HttpContext httpContext,
        SessionService sessionService,
        ICsrfTokenService csrfTokenService,
        UpdateUserService updateUserService,
        CancellationToken cancellationToken)
    {
        var authorization =
            await PortalAuthorization.AuthorizeActionAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Users,
                MenuActions.Update,
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

        if (!PortalCsrf.Validate(
                httpContext,
                csrfTokenService))
        {
            return Results.StatusCode(
                StatusCodes.Status403Forbidden
            );
        }

        var updated =
            await updateUserService.UpdateAsync(
                userId,
                request,
                authorization.User!.UserId,
                authorization.User.Name,
                cancellationToken
            );

        return updated
            ? Results.NoContent()
            : Results.NotFound();
    }

    private sealed record CreateUserResponse(
        long UserId
    );

    private sealed record RevokeSessionsResponse(
        int Revoked
    );

    private sealed record UnlockLoginResponse(
        int Cleared
    );
}
