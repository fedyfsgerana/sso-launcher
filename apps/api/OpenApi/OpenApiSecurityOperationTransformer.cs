using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace SsoLauncher.Api.OpenApi;

public sealed class OpenApiSecurityOperationTransformer
    : IOpenApiOperationTransformer
{
    private static readonly HashSet<string>
        MutatingMethods =
        [
            "POST",
            "PUT",
            "PATCH",
            "DELETE"
        ];

    public Task TransformAsync(
        OpenApiOperation operation,
        OpenApiOperationTransformerContext context,
        CancellationToken cancellationToken)
    {
        var relativePath =
            context.Description.RelativePath
            ?? string.Empty;

        var httpMethod =
            context.Description.HttpMethod
            ?? string.Empty;

        if (IsPublicEndpoint(
                relativePath,
                httpMethod))
        {
            return Task.CompletedTask;
        }

        var isServiceBearerEndpoint =
            IsServiceBearerEndpoint(
                relativePath);

        operation.Security ??=
            [];

        var securityScheme =
            isServiceBearerEndpoint
                ? "ServiceBearer"
                : "SessionCookie";

        operation.Security.Add(
            new OpenApiSecurityRequirement
            {
                [
                    new OpenApiSecuritySchemeReference(
                        securityScheme,
                        context.Document
                    )
                ] = []
            }
        );

        if (!isServiceBearerEndpoint
            && RequiresCsrf(httpMethod))
        {
            operation.Parameters ??=
                [];

            operation.Parameters.Add(
                new OpenApiParameter
                {
                    Name = "X-CSRF-Token",
                    In = ParameterLocation.Header,
                    Required = true,
                    Description =
                        "CSRF token matching the sso_launcher_csrf cookie.",
                    Schema =
                        new OpenApiSchema
                        {
                            Type = JsonSchemaType.String
                        }
                }
            );
        }

        return Task.CompletedTask;
    }

    private static bool IsPublicEndpoint(
        string relativePath,
        string httpMethod)
    {
        return relativePath.Equals(
                "health",
                StringComparison.OrdinalIgnoreCase)
            || relativePath.Equals(
                "api/auth/login",
                StringComparison.OrdinalIgnoreCase)
            || relativePath.Equals(
                "api/service-auth/token",
                StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsServiceBearerEndpoint(
        string relativePath)
    {
        return relativePath.Equals(
            "api/sso/validate",
            StringComparison.OrdinalIgnoreCase);
    }

    private static bool RequiresCsrf(
        string httpMethod)
    {
        return MutatingMethods.Contains(
            httpMethod.ToUpperInvariant()
        );
    }
}