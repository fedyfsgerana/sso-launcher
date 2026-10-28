namespace SsoLauncher.Domain.Entities;

public sealed class AuditLog
{
    public long Id { get; set; }

    public long? ActorId { get; set; }

    public string ActorName { get; set; } = string.Empty;

    public string Action { get; set; } = string.Empty;

    public string Outcome { get; set; } = "success";

    public string TargetType { get; set; } = string.Empty;

    public long? TargetId { get; set; }

    public string TargetName { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public string? Reason { get; set; }

    public string? Changes { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public string? Browser { get; set; }

    public string? BrowserVersion { get; set; }

    public string? OperatingSystem { get; set; }

    public string? DeviceType { get; set; }

    public string? DeviceName { get; set; }

    public string? SessionRef { get; set; }

    public string? RequestId { get; set; }

    public string? HttpMethod { get; set; }

    public string? RequestPath { get; set; }

    public DateTimeOffset OccurredAt { get; set; }

    public User? Actor { get; set; }
}
