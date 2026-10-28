#nullable enable

namespace SsoLauncher.Application.UserGroups.GetUserGroupDetail;

public sealed record UserGroupMemberResponse(
    long UserId,
    string Name,
    string Email,
    string? Department,
    string? DepartemenCode,
    string? JobTitle,
    bool IsActive
);

public sealed record UserGroupAccessResponse(
    long ApplicationId,
    string ApplicationName,
    string Category,
    string Icon,
    string Color,
    string Status
);

public sealed record UserGroupMenuResponse(
    long MenuId,
    long? ParentId,
    string Label,
    string Icon,
    bool IsActive
);

public sealed record UserGroupMenuActionResponse(
    long MenuId,
    string ActionKey
);

public sealed record UserGroupDetailResponse(
    long Id,
    string Name,
    string Description,
    string? Department,
    string? DepartemenCode,
    bool IsActive,
    IReadOnlyList<UserGroupMemberResponse> Members,
    IReadOnlyList<UserGroupAccessResponse> Accesses,
    IReadOnlyList<UserGroupMenuResponse> Menus,
    IReadOnlyList<UserGroupMenuActionResponse> MenuActions
);
