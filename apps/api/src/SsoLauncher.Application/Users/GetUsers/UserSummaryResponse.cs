namespace SsoLauncher.Application.Users.GetUsers;

public sealed record UserSummaryResponse(
    int Total,
    int Active,
    int Inactive
);
