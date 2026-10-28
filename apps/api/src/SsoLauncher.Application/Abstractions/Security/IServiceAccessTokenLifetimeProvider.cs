namespace SsoLauncher.Application.Abstractions.Security;

public interface IServiceAccessTokenLifetimeProvider
{
    TimeSpan Lifetime { get; }
}