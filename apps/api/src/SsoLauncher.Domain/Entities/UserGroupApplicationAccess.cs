namespace SsoLauncher.Domain.Entities;

public sealed class UserGroupApplicationAccess : ISoftDeletable
{
    public long Id { get; set; }

    public long UserGroupId { get; set; }

    public long ApplicationId { get; set; }


    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public long? DeletedById { get; set; }

    public string? DeletedByName { get; set; }

    public string? DeleteReason { get; set; }

    public UserGroup UserGroup { get; set; } = null!;

    public Application Application { get; set; } = null!;
}