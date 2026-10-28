namespace SsoLauncher.Domain.Entities;

public sealed class NotificationSetting
{
    public long Id { get; set; }

    public long UserId { get; set; }

    public bool AccessChanges { get; set; } = true;

    public bool ApplicationStatus { get; set; } = true;

    public DateTimeOffset UpdatedAt { get; set; }

    public User User { get; set; } = null!;
}