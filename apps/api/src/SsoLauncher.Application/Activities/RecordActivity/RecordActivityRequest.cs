namespace SsoLauncher.Application.Activities.RecordActivity;

public sealed record RecordActivityRequest(
    string Kind,
    long? ApplicationId,
    string Title,
    string Subtitle,
    string? TargetPath
);