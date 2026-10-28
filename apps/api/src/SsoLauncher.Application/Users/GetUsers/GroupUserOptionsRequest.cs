#nullable enable

namespace SsoLauncher.Application.Users.GetUsers;

public sealed record GroupUserOptionsRequest(
    int? Page,
    int? PageSize,
    string? Search,
    string? View,
    string? Sort,
    string? Direction
);
