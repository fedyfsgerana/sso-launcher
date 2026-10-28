namespace SsoLauncher.Application.UserGroups.ManageAccess;

public sealed record GroupAccessItem(
    long ApplicationId
);

public sealed record SetGroupAccessRequest(
    IReadOnlyList<GroupAccessItem> Accesses
);