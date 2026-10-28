namespace SsoLauncher.Domain.Entities;

public sealed class RefreshToken
{
    public long Id { get; set; }

    public long UserId { get; set; }

    public string TokenHash { get; set; } =
        string.Empty;

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? RevokedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? LastSeenAt { get; set; }

    public User User { get; set; } =
        null!;
}
