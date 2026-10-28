namespace SsoLauncher.Application.Activities.GetRecentActions;

public sealed record RecentActionResponse(
    long Id,
    string Action,
    string TargetType,
    string TargetName,
    string Summary,
    DateTimeOffset OccurredAt
);
