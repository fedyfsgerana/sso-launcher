#nullable enable

namespace SsoLauncher.Application.Audit.Snapshots;

public sealed record AuditReference(
    long Id,
    string Name
);

public sealed record AuditApplicationGrant(
    long Id,
    string Name
);

public sealed record UserAuditSnapshot(
    string Name,
    string Email,
    string? EmployeeNumber,
    string? Department,
    string? DepartemenCode,
    string? JobTitle,
    bool IsActive,
    bool Deleted
);

public sealed record ApplicationAuditSnapshot(
    string Name,
    string Slug,
    string Description,
    string LaunchUrl,
    string Category,
    string Icon,
    string Color,
    string Status,
    string MaintenanceMessage,
    bool IsActive,
    bool Deleted,
    bool? UsesSso
);

public sealed record UserGroupAuditSnapshot(
    string Name,
    string Description,
    string? Department,
    string? DepartemenCode,
    bool IsActive,
    bool Deleted,
    IReadOnlyList<AuditReference> Members,
    IReadOnlyList<AuditApplicationGrant> Applications,
    IReadOnlyList<AuditReference> Menus
);

public sealed record PortalMenuAuditSnapshot(
    long? ParentId,
    string Label,
    string Icon,
    string TargetType,
    string TargetValue,
    bool IsActive,
    bool MaintenanceActive,
    string? MaintenanceTitle,
    string? MaintenanceMessage,
    bool Deleted,
    IReadOnlyList<AuditReference> Groups
);

public sealed record ServiceCredentialAuditSnapshot(
    long ApplicationId,
    string ClientId,
    string Scope,
    bool IsActive,
    bool Deleted
);
