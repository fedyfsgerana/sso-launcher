namespace SsoLauncher.Application.UserGroups.ManageMembers;

public sealed record SetGroupMembersRequest(
    IReadOnlyList<long> UserIds
);