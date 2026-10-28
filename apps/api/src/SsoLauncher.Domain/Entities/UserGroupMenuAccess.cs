namespace SsoLauncher.Domain.Entities;

public sealed class UserGroupMenuAccess : ISoftDeletable
{
    public long Id { get; set; }

    public long UserGroupId { get; set; }

    public long PortalMenuId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public long? DeletedById { get; set; }

    public string? DeletedByName { get; set; }

    public string? DeleteReason { get; set; }

    public UserGroup UserGroup { get; set; } = null!;

    public PortalMenu PortalMenu { get; set; } = null!;
}
