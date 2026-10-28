namespace SsoLauncher.Application.Applications.GetApplicationCatalog;

public sealed record ApplicationCatalogItemResponse(
    long Id,
    string Name,
    string Slug,
    string Description,
    string Category,
    string Icon,
    string Color,
    string Status
);