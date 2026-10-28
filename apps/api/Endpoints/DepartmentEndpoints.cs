using SsoLauncher.Api.Authorization;
using SsoLauncher.Application.Auth.Session;
using SsoLauncher.Application.Organization;

namespace SsoLauncher.Api.Endpoints;

public static class DepartmentEndpoints
{
    public static IEndpointRouteBuilder MapDepartmentEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/departments", GetDepartmentsAsync)
            .WithTags("Departments")
            .WithName("GetDepartments")
            .WithSummary("Get departments")
            .WithDescription(
                "Returns the built-in department list used for users, groups, and application categories. Requires an authenticated session."
            )
            .Produces<DepartmentListResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized);

        return endpoints;
    }

    private static async Task<IResult> GetDepartmentsAsync(
        HttpContext httpContext,
        SessionService sessionService,
        DepartmentCatalog departmentCatalog,
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

        var departments = await departmentCatalog.GetAsync(cancellationToken);

        return Results.Ok(departments);
    }
}
