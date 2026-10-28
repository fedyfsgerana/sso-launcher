namespace SsoLauncher.Application.Auth.Login;

public sealed record LoginLockStatus(
    int RecentFailures,
    DateTimeOffset? AccountLockedUntil,
    IReadOnlyList<LockedAddress> LockedAddresses
)
{
    public bool IsLocked =>
        AccountLockedUntil is not null || LockedAddresses.Count > 0;
}

public sealed record LockedAddress(
    string IpAddress,
    int Failures,
    DateTimeOffset LockedUntil
);