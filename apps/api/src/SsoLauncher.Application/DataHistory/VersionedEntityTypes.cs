using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.DataHistory;

public static class VersionedEntityTypes
{
    private static readonly HashSet<string> Rollbackable =
        new(StringComparer.Ordinal)
        {
            AuditTargets.User,
            AuditTargets.UserGroup,
            AuditTargets.Application,
            AuditTargets.PortalMenu
        };

    private static readonly HashSet<string> Viewable =
        new(Rollbackable, StringComparer.Ordinal)
        {
            AuditTargets.ServiceCredential
        };

    public static bool CanView(string entityType)
    {
        return Viewable.Contains(entityType);
    }

    public static bool CanRollback(string entityType)
    {
        return Rollbackable.Contains(entityType);
    }
}