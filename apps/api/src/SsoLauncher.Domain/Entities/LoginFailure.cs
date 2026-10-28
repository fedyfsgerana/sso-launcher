namespace SsoLauncher.Domain.Entities;

public sealed class LoginFailure
{
    public long Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public string IpAddress { get; set; } = string.Empty;

    public DateTimeOffset OccurredAt { get; set; }

    public DateTimeOffset? ClearedAt { get; set; }
}