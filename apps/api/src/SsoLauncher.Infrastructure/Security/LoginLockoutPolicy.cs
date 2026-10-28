using Microsoft.Extensions.Options;
using SsoLauncher.Application.Abstractions.Security;

namespace SsoLauncher.Infrastructure.Security;

public sealed class LoginLockoutPolicy(
    IOptions<LoginLockoutOptions> options)
    : ILoginLockoutPolicy
{
    public int MaxFailuresPerAddress =>
        Math.Max(1, options.Value.MaxFailuresPerAddress);

    public int MaxFailuresPerAccount =>
        Math.Max(MaxFailuresPerAddress, options.Value.MaxFailuresPerAccount);

    public TimeSpan Window =>
        TimeSpan.FromMinutes(Math.Max(1, options.Value.WindowMinutes));
}