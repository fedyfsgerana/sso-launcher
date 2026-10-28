namespace SsoLauncher.Domain.Entities;

public sealed class Application : ISoftDeletable
{
    public long Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string AppUrl { get; set; } = string.Empty;

    public string LaunchUrl { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string Icon { get; set; } = "apps";

    public string Color { get; set; } = "app-hr";

    public string Status { get; set; } = "active";

    public string MaintenanceMessage { get; set; } = string.Empty;
    public bool UsesSso { get; set; } = true;

    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public long? DeletedById { get; set; }

    public string? DeletedByName { get; set; }

    public string? DeleteReason { get; set; }

    public ICollection<ApplicationFavorite> Favorites { get; set; } = [];

    public ICollection<ApplicationServiceCredential> ServiceCredentials { get; set; } = [];
}
