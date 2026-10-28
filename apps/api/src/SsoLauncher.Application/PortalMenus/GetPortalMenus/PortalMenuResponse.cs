#nullable enable

namespace SsoLauncher.Application.PortalMenus.GetPortalMenus;

public sealed record PortalMenuResponse(
    long Id,
    long? ParentId,
    string Label,
    string Icon,
    string TargetType,
    string TargetValue,
    int SortOrder,
    bool IsSystem,
    bool IsActive,
    bool MaintenanceActive,
    string? MaintenanceTitle,
    string? MaintenanceMessage,
    IReadOnlyList<long> GroupIds,
    IReadOnlyList<string> GroupNames,
    DateTimeOffset UpdatedAt
);
