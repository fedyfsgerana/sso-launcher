namespace SsoLauncher.Domain.Entities;

public sealed class UserGroupMember : ISoftDeletable
{
    public long Id { get; set; }

    public long UserGroupId { get; set; }

    public long UserId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public long? DeletedById { get; set; }

    public string? DeletedByName { get; set; }

    public string? DeleteReason { get; set; }

    public UserGroup UserGroup { get; set; } = null!;

    public User User { get; set; } = null!;
}
