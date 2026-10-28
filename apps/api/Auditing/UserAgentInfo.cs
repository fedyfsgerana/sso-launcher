namespace SsoLauncher.Api.Auditing;

public sealed record UserAgentInfo(
    string? Browser,
    string? BrowserVersion,
    string? OperatingSystem,
    string DeviceType
);