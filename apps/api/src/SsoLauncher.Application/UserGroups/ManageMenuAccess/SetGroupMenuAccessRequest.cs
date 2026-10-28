namespace SsoLauncher.Application.UserGroups.ManageMenuAccess;

public sealed record SetGroupMenuAccessRequest(
    IReadOnlyList<long> MenuIds,
    IReadOnlyList<GroupMenuActionItem>? Actions
);

public sealed record GroupMenuActionItem(
    long MenuId,
    string ActionKey
);
