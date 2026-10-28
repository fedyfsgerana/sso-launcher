namespace SsoLauncher.Application.Applications.GetMyApplications;

public sealed record MyApplicationResponse(
    long Id,
    string Name,
    string Slug,
    string Description,
    string LaunchUrl,
    string Category,
    string Icon,
    string Color,
    string Status,
    string MaintenanceMessage,
    bool UsesSso,
    bool IsFavorite,
    DateTimeOffset? LastOpenedAt,
    string AppUrl = ""
);
