namespace SsoLauncher.Application.PortalMenus.CreatePortalMenu;

public sealed record CreatePortalMenuRequest(
    string Label,
    string? Icon,
    long? ParentId,
    string TargetType,
    string TargetValue,
    bool IsActive
);
