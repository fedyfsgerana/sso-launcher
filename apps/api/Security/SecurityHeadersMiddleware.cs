namespace SsoLauncher.Api.Security;

public sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    private const string ApiContentSecurityPolicy =
        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

    private static readonly PathString[] DocumentationPaths =
    [
        new("/scalar"),
        new("/openapi")
    ];

    public Task InvokeAsync(HttpContext httpContext)
    {
        var isDocumentation = DocumentationPaths.Any(
            path => httpContext.Request.Path.StartsWithSegments(path)
        );

        httpContext.Response.OnStarting(() =>
        {
            var headers = httpContext.Response.Headers;

            headers.XContentTypeOptions = "nosniff";
            headers.XFrameOptions = "DENY";
            headers["Referrer-Policy"] = "no-referrer";
            headers["Permissions-Policy"] =
                "camera=(), microphone=(), geolocation=(), payment=()";
            headers["Cross-Origin-Opener-Policy"] = "same-origin";

            if (!isDocumentation)
            {
                headers.ContentSecurityPolicy = ApiContentSecurityPolicy;
            }

            return Task.CompletedTask;
        });

        return next(httpContext);
    }
}
