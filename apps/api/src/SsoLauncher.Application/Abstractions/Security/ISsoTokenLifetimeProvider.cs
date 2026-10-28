namespace SsoLauncher.Application.Abstractions.Security;

public interface ISsoTokenLifetimeProvider
{
    TimeSpan Lifetime { get; }
}