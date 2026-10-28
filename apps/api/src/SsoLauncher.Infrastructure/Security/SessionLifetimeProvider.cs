using Microsoft.Extensions.Options;
using SsoLauncher.Application.Abstractions.Security;

namespace SsoLauncher.Infrastructure.Security;

public sealed class SessionLifetimeProvider(
    IOptions<SessionOptions> options)
    : ISessionLifetimeProvider
{
    public TimeSpan Lifetime =>
        TimeSpan.FromHours(
            Math.Max(
                1,
                options.Value.LifetimeHours
            )
        );

    public TimeSpan IdleTimeout =>
        TimeSpan.FromMinutes(
            Math.Max(
                1,
                options.Value.IdleMinutes
            )
        );
}
