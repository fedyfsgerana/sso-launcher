using Microsoft.Extensions.Options;
using SsoLauncher.Application.Abstractions.Security;

namespace SsoLauncher.Infrastructure.Security;

public sealed class SsoTokenLifetimeProvider(
    IOptions<SsoTokenOptions> options)
    : ISsoTokenLifetimeProvider
{
    public TimeSpan Lifetime =>
        TimeSpan.FromSeconds(
            Math.Max(1, options.Value.LifetimeSeconds)
        );
}