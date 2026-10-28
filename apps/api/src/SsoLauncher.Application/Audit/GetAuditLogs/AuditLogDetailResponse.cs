namespace SsoLauncher.Application.Audit.GetAuditLogs;

public sealed record AuditLogDetailResponse(
    long Id,
    long? ActorId,
    string ActorName,
    string Action,
    string Outcome,
    string Module,
    string TargetType,
    long? TargetId,
    string TargetName,
    string Summary,
    string? Reason,
    DateTimeOffset OccurredAt,
    string? IpAddress,
    string? DeviceName,
    string? DeviceType,
    string? OperatingSystem,
    string? Browser,
    string? BrowserVersion,
    string? UserAgent,
    string? SessionRef,
    string? RequestId,
    string? HttpMethod,
    string? RequestPath,
    int? Version,
    IReadOnlyList<AuditFieldChange> Changes
);