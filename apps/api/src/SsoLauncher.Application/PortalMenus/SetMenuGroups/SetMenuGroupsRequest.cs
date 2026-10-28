namespace SsoLauncher.Application.PortalMenus.SetMenuGroups;

public sealed record SetMenuGroupsRequest(
    IReadOnlyList<long> GroupIds
);