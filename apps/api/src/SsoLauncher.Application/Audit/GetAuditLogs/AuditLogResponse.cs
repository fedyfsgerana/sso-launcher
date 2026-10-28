namespace SsoLauncher.Application.Audit.GetAuditLogs;

public sealed record AuditLogResponse(
    long Id,
    long? ActorId,
    string ActorName,
    string Action,
    string TargetType,
    long? TargetId,
    string TargetName,
    string Summary,
    DateTimeOffset OccurredAt,
    string Module,
    string Outcome,
    string? Reason,
    string? IpAddress,
    string? DeviceName,
    string? DeviceType,
    string? OperatingSystem,
    string? Browser,
    string? BrowserVersion,
    bool HasChanges
);