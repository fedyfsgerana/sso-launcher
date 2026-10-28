using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Abstractions.Security;

namespace SsoLauncher.Api.Auditing;

public sealed class AuditContextMiddleware(RequestDelegate next)
{
    public const string ReasonQueryKey = "reason";

    private const string AdminPathPrefix = "/api/admin";

    public async Task InvokeAsync(
        HttpContext httpContext,
        ClientDeviceNameResolver deviceNameResolver,
        ISessionTokenService sessionTokenService,
        AuditScope auditScope)
    {
        var method = httpContext.Request.Method;

        if (!HttpMethods.IsGet(method) &&
            !HttpMethods.IsHead(method) &&
            !HttpMethods.IsOptions(method))
        {
            var deviceName = await deviceNameResolver.ResolveAsync(
                httpContext.Connection.RemoteIpAddress,
                httpContext.RequestAborted
            );

            httpContext.Items[HttpAuditContextAccessor.ItemKey] =
                HttpAuditContextAccessor.Create(
                    httpContext,
                    sessionTokenService,
                    deviceName
                );
        }

        if (HttpMethods.IsDelete(method))
        {
            auditScope.SetDeleteReason(
                httpContext.Request.Query[ReasonQueryKey].ToString()
            );

            if (auditScope.DeleteReason is null &&
                httpContext.Request.Path.StartsWithSegments(AdminPathPrefix))
            {
                httpContext.Response.StatusCode =
                    StatusCodes.Status400BadRequest;

                await httpContext.Response.WriteAsJsonAsync(
                    new { error = "reason_required" },
                    httpContext.RequestAborted
                );

                return;
            }
        }

        await next(httpContext);
    }
}