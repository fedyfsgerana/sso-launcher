namespace SsoLauncher.Application.Abstractions.Security;

public interface ISessionLifetimeProvider
{
    TimeSpan Lifetime { get; }

    TimeSpan IdleTimeout { get; }
}
