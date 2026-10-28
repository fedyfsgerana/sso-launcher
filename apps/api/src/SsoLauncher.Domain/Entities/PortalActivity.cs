namespace SsoLauncher.Domain.Entities;

public sealed class PortalActivity : ISoftDeletable
{
    public long Id { get; set; }

    public long UserId { get; set; }

    public long? ApplicationId { get; set; }

    public string Kind { get; set; } = "application";

    public string Title { get; set; } = string.Empty;

    public string Subtitle { get; set; } = string.Empty;

    public string? TargetPath { get; set; }

    public DateTimeOffset OccurredAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public long? DeletedById { get; set; }

    public string? DeletedByName { get; set; }

    public string? DeleteReason { get; set; }

    public User User { get; set; } = null!;

    public Application? Application { get; set; }
}
