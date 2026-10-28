namespace SsoLauncher.Domain.Entities;

public sealed class UserGroupMenuAction
{
    public long Id { get; set; }

    public long UserGroupId { get; set; }

    public long PortalMenuId { get; set; }

    public string ActionKey { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public UserGroup UserGroup { get; set; } = null!;

    public PortalMenu PortalMenu { get; set; } = null!;
}
