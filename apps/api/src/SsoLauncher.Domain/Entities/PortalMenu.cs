namespace SsoLauncher.Domain.Entities;

public sealed class PortalMenu : ISoftDeletable
{
    public long Id { get; set; }

    public long? ParentId { get; set; }

    public PortalMenu? Parent { get; set; }

    public ICollection<PortalMenu> Children { get; set; } = new List<PortalMenu>();

    public string Label { get; set; } = string.Empty;

    public string Icon { get; set; } = "menu";

    public string TargetType { get; set; } = "page";

    public string TargetValue { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public bool IsSystem { get; set; }

    public bool IsActive { get; set; } = true;

    public bool MaintenanceActive { get; set; }

    public string? MaintenanceTitle { get; set; }

    public string? MaintenanceMessage { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public long? DeletedById { get; set; }

    public string? DeletedByName { get; set; }

    public string? DeleteReason { get; set; }
}
