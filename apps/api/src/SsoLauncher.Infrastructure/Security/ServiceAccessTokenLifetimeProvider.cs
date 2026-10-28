using Microsoft.Extensions.Options;
using SsoLauncher.Application.Abstractions.Security;

namespace SsoLauncher.Infrastructure.Security;

public sealed class ServiceAccessTokenLifetimeProvider(
    IOptions<ServiceAccessTokenOptions> options)
    : IServiceAccessTokenLifetimeProvider
{
    private readonly ServiceAccessTokenOptions _options =
        options.Value;

    public TimeSpan Lifetime =>
        TimeSpan.FromSeconds(
            Math.Max(
                1,
                _options.LifetimeSeconds
            )
        );
}