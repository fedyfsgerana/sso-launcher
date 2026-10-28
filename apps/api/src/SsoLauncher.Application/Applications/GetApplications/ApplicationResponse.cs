namespace SsoLauncher.Application.Applications.GetApplications;

public sealed record ApplicationResponse(
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
    bool IsActive,
    int UserCount,
    int CredentialCount,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    string AppUrl = "",
    string? CallbackPath = null
);
