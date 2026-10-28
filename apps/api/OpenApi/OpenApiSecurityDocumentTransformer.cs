using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace SsoLauncher.Api.OpenApi;

public sealed class OpenApiSecurityDocumentTransformer
    : IOpenApiDocumentTransformer
{
    public Task TransformAsync(
        OpenApiDocument document,
        OpenApiDocumentTransformerContext context,
        CancellationToken cancellationToken)
    {
        document.Components ??=
            new OpenApiComponents();

        document.Components.SecuritySchemes ??=
            new Dictionary<string, IOpenApiSecurityScheme>();

        document.Components.SecuritySchemes["SessionCookie"] =
            new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.ApiKey,
                In = ParameterLocation.Cookie,
                Name = "sso_launcher_session",
                Description =
                    "SSO Launcher authenticated browser session cookie."
            };

        document.Components.SecuritySchemes["ServiceBearer"] =
            new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "SSO Launcher service access token",
                Description =
                    "Short-lived service access token issued by /api/service-auth/token."
            };

        return Task.CompletedTask;
    }
}