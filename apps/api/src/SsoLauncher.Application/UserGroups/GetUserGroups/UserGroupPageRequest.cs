#nullable enable

namespace SsoLauncher.Application.UserGroups.GetUserGroups;

public sealed record UserGroupPageRequest(
    int? Page,
    int? PageSize,
    string? Search,
    string? Status,
    string? Department,
    string? Sort,
    string? Direction
);
