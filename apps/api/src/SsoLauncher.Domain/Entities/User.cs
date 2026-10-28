namespace SsoLauncher.Domain.Entities;

public sealed class User : ISoftDeletable
{
    public long Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string? EmployeeNumber { get; set; }

    public string? Department { get; set; }

    public string? DepartemenCode { get; set; }

    public string? JobTitle { get; set; }

    public bool IsActive { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public long? DeletedById { get; set; }

    public string? DeletedByName { get; set; }

    public string? DeleteReason { get; set; }

    public ICollection<ApplicationFavorite> Favorites { get; set; } =
        new List<ApplicationFavorite>();

    public ICollection<PortalActivity> Activities { get; set; } =
        new List<PortalActivity>();

    public ICollection<UserGroupMember> GroupMemberships { get; set; } =
        new List<UserGroupMember>();

    public ICollection<RefreshToken> RefreshTokens { get; set; } =
        new List<RefreshToken>();
}
