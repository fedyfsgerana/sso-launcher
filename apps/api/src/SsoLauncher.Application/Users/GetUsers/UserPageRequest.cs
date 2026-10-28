#nullable enable

namespace SsoLauncher.Application.Users.GetUsers;

public sealed record UserPageRequest(
    int? Page,
    int? PageSize,
    string? Search,
    string? Status,
    string? Department,
    long? GroupId,
    string? Sort,
    string? Direction,
    long? ExcludeGroupId = null,
    string? DepartemenCode = null
);
