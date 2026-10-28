namespace SsoLauncher.Domain.Entities;

public sealed class Notification
{
    public long Id { get; set; }

    public long UserId { get; set; }

    public string Kind { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    public string? Link { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? ReadAt { get; set; }

    public User User { get; set; } = null!;
}