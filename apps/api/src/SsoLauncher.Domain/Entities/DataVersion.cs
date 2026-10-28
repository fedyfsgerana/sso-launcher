namespace SsoLauncher.Domain.Entities;

public sealed class DataVersion
{
    public long Id { get; set; }

    public string EntityType { get; set; } = string.Empty;

    public long EntityId { get; set; }

    public int Version { get; set; }

    public string Action { get; set; } = string.Empty;

    public string Snapshot { get; set; } = "{}";

    public long? AuditLogId { get; set; }

    public long? ActorId { get; set; }

    public string ActorName { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }
}
