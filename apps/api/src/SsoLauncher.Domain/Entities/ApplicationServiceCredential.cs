namespace SsoLauncher.Domain.Entities;

public sealed class ApplicationServiceCredential : ISoftDeletable
{
    public long Id { get; set; }

    public long ApplicationId { get; set; }

    public string ClientId { get; set; } = string.Empty;

    public string SecretHash { get; set; } = string.Empty;

    public string Scope { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public DateTimeOffset? LastUsedAt { get; set; }

    public DateTimeOffset? GuideDownloadedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public long? DeletedById { get; set; }

    public string? DeletedByName { get; set; }

    public string? DeleteReason { get; set; }

    public Application Application { get; set; } = null!;
}
