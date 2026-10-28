namespace SsoLauncher.Application.PortalMenus.SetMenuMaintenance;

public sealed record SetMenuMaintenanceRequest(
    bool Active,
    string? Title,
    string? Message
);
