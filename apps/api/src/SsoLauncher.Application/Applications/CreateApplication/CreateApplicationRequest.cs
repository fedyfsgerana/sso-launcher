namespace SsoLauncher.Application.Applications.CreateApplication;

public sealed record CreateApplicationRequest(
    string Name,
    string Slug,
    string Description,
    string LaunchUrl,
    string? Category,
    string? Icon,
    string? Color,
    string? Status,
    bool? UsesSso,
    string? AppUrl = null,
    string? CallbackPath = null
);
