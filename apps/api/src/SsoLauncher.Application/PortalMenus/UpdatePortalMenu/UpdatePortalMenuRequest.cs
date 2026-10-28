namespace SsoLauncher.Application.PortalMenus.UpdatePortalMenu;

public sealed record UpdatePortalMenuRequest(
    string Label,
    string? Icon,
    long? ParentId,
    string TargetType,
    string TargetValue,
    bool IsActive
);
