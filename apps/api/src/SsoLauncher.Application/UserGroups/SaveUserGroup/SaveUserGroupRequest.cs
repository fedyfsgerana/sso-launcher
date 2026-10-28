#nullable enable

namespace SsoLauncher.Application.UserGroups.SaveUserGroup;

public sealed record SaveUserGroupRequest(
    string Name,
    string Description,
    string? Department,
    bool IsActive
);
