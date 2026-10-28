#nullable enable

namespace SsoLauncher.Application.UserGroups.GetUserGroups;

public sealed record UserGroupResponse(
    long Id,
    string Name,
    string Description,
    string? Department,
    string? DepartemenCode,
    bool IsActive,
    int MemberCount,
    int ApplicationCount,
    int MenuCount,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);
