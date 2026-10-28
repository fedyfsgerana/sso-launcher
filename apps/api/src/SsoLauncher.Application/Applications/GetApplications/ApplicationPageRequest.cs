#nullable enable

namespace SsoLauncher.Application.Applications.GetApplications;

public sealed record ApplicationPageRequest(
    int? Page,
    int? PageSize,
    string? Search,
    string? Status,
    string? Category,
    string? Sort,
    string? Direction
);
