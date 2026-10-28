using System.Text.Json.Nodes;
using SsoLauncher.Application.Audit;

namespace SsoLauncher.Application.DataHistory;

public sealed record DataVersionResponse(
    int Version,
    string Action,
    string ActorName,
    DateTimeOffset CreatedAt,
    long? AuditLogId,
    string Summary,
    string? Reason,
    bool IsCurrent,
    JsonObject? Snapshot,
    IReadOnlyList<AuditFieldChange> Changes
);