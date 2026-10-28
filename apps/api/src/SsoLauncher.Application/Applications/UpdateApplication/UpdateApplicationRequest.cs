namespace SsoLauncher.Application.Applications.UpdateApplication;

public sealed record UpdateApplicationRequest(
    string Name,
    string Slug,
    string Description,
    string LaunchUrl,
    string? Category,
    string? Icon,
    string? Color,
    string? Status,
    string? MaintenanceMessage,
    bool? UsesSso,
    string? AppUrl = null,
    string? CallbackPath = null
);
