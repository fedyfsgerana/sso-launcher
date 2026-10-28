#nullable enable

namespace SsoLauncher.Domain.Entities;

public sealed class UserGroup : ISoftDeletable
{
    public long Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string? Department { get; set; }

    public string? DepartemenCode { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public long? DeletedById { get; set; }

    public string? DeletedByName { get; set; }

    public string? DeleteReason { get; set; }

    public ICollection<UserGroupMember> Members { get; set; } =
        new List<UserGroupMember>();

    public ICollection<UserGroupApplicationAccess> Accesses { get; set; } =
        new List<UserGroupApplicationAccess>();

    public ICollection<UserGroupMenuAccess> MenuAccesses { get; set; } =
        new List<UserGroupMenuAccess>();
}
