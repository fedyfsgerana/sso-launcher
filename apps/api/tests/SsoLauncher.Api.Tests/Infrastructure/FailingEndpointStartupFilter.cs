using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;

namespace SsoLauncher.Api.Tests.Infrastructure;

public sealed class FailingEndpointStartupFilter : IStartupFilter
{
    public const string Path = "/__test/error";
    public const string SecretMessage = "detail-internal-rahasia";

    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
    {
        return app =>
        {
            next(app);

            app.Map(
                Path,
                branch => branch.Run(
                    _ => throw new InvalidOperationException(SecretMessage)
                )
            );
        };
    }
}
