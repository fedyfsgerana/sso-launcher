namespace SsoLauncher.Application.PortalMenus.ReorderPortalMenus;

public sealed record ReorderPortalMenusRequest(
    IReadOnlyList<PortalMenuOrderItem> Items
);

public sealed record PortalMenuOrderItem(
    long Id,
    long? ParentId,
    int SortOrder
);