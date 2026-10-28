namespace SsoLauncher.Application.UserGroups.GetUserGroups;

public sealed record UserGroupSummaryResponse(
    int Total,
    int Active,
    int Inactive,
    int WithoutMembers
);
