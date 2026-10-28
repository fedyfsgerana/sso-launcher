namespace SsoLauncher.Application.Abstractions.Auditing;

public sealed record AuditContext(
    string? IpAddress,
    string? UserAgent,
    string? Browser,
    string? BrowserVersion,
    string? OperatingSystem,
    string? DeviceType,
    string? DeviceName,
    string? SessionRef,
    string? RequestId,
    string? HttpMethod,
    string? RequestPath)
{
    public static AuditContext Empty { get; } =
        new(null, null, null, null, null, null, null, null, null, null, null);
}