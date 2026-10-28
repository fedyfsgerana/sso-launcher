namespace SsoLauncher.Application.Abstractions.Security;

public interface ILoginLockoutPolicy
{
    int MaxFailuresPerAddress { get; }

    int MaxFailuresPerAccount { get; }

    TimeSpan Window { get; }
}