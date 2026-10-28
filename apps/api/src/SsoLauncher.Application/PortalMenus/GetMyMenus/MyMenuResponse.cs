namespace SsoLauncher.Application.PortalMenus.GetMyMenus;

public sealed record MyMenuResponse(
    long Id,
    long? ParentId,
    string Label,
    string Icon,
    string TargetType,
    string TargetValue,
    int SortOrder,
    bool MaintenanceActive,
    string? MaintenanceTitle,
    string? MaintenanceMessage,
    IReadOnlyList<string> Actions
);
