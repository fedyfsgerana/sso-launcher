#nullable enable

namespace SsoLauncher.Application.Audit.GetAuditLogs;

public sealed record AuditLogFilter(
    string? Action,
    string? TargetType,
    string? Search,
    long? TargetId,
    long? ActorId,
    DateTimeOffset? From,
    DateTimeOffset? To,
    string? Module = null,
    string? Outcome = null,
    string? IpAddress = null,
    string? Sort = null,
    string? Direction = null
);
