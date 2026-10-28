using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;

namespace SsoLauncher.Api.Tests.Infrastructure;

public sealed class TestClientAddressStartupFilter : IStartupFilter
{
    public const string HeaderName = "X-Test-Client-Address";

    private static int sequence;

    public static string NextAddress()
    {
        var value = Interlocked.Increment(ref sequence);

        return $"10.77.{value / 250 % 250}.{value % 250 + 1}";
    }

    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
    {
        return app =>
        {
            app.Use(async (context, nextMiddleware) =>
            {
                if (context.Request.Headers.TryGetValue(HeaderName, out var value) &&
                    IPAddress.TryParse(value.ToString(), out var address))
                {
                    context.Connection.RemoteIpAddress = address;
                }

                await nextMiddleware(context);
            });

            next(app);
        };
    }
}
