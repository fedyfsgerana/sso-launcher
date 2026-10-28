using Microsoft.AspNetCore.Http.Features;

namespace SsoLauncher.Api.Security;

public sealed class RequestSizeLimitMiddleware(
    RequestDelegate next,
    long maxBodyBytes)
{
    public Task InvokeAsync(HttpContext httpContext)
    {
        if (httpContext.Request.ContentLength > maxBodyBytes)
        {
            httpContext.Response.StatusCode =
                StatusCodes.Status413PayloadTooLarge;

            return Task.CompletedTask;
        }

        var limit = httpContext.Features
            .Get<IHttpMaxRequestBodySizeFeature>();

        if (limit is { IsReadOnly: false })
        {
            limit.MaxRequestBodySize = maxBodyBytes;
        }

        return next(httpContext);
    }
}
