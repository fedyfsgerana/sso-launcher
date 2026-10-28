#nullable enable

using System.Text;
using SsoLauncher.Application.ServiceCredentials.IntegrationPackage;

namespace SsoLauncher.Api.Endpoints;

internal static class IntegrationGuideSource
{
    public static PortalAddresses Addresses(HttpContext httpContext, IConfiguration configuration)
    {
        var request = httpContext.Request;

        return new PortalAddresses(
            (configuration["IntegrationPackage:PortalWebUrl"] ??
             configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()?.FirstOrDefault() ??
             string.Empty).TrimEnd('/'),
            (configuration["IntegrationPackage:PortalApiUrl"] ??
             $"{request.Scheme}://{request.Host}{request.PathBase}").TrimEnd('/')
        );
    }

    public static async Task<string> ReadGuideAsync(CancellationToken cancellationToken)
    {
        await using var stream = typeof(IntegrationGuideSource).Assembly
            .GetManifestResourceStream("sso-integration-guide.md");

        if (stream is null)
        {
            return string.Empty;
        }

        using var reader = new StreamReader(stream, Encoding.UTF8);

        return await reader.ReadToEndAsync(cancellationToken);
    }
}
