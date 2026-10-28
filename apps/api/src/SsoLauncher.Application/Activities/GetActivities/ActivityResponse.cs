namespace SsoLauncher.Application.Activities.GetActivities;

public sealed record ActivityResponse(
    long Id,
    string Kind,
    long? ApplicationId,
    string Title,
    string Subtitle,
    string? TargetPath,
    DateTimeOffset OccurredAt
);