namespace SsoLauncher.Application.Overview;

public sealed record OverviewInsightsResponse(
    LastLoginResponse? LastLogin,
    int? LockedAccounts,
    int? FailedLoginsLastDay,
    int OpenedLastWeek
);

public sealed record LastLoginResponse(
    DateTimeOffset OccurredAt,
    string? IpAddress,
    string? Browser,
    string? BrowserVersion,
    string? OperatingSystem,
    string? DeviceType,
    string? DeviceName
);
