namespace SsoLauncher.Domain.Entities;

public sealed class SsoTokenUse
{
    public long Id { get; set; }

    public string TokenId { get; set; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset UsedAt { get; set; }
}
