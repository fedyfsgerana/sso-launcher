using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.RecycleBin;

public static class RecycleBinTypes
{
    private static readonly HashSet<string> Supported =
        new(StringComparer.Ordinal)
        {
            AuditTargets.User,
            AuditTargets.Application,
            AuditTargets.UserGroup,
            AuditTargets.PortalMenu
        };

    public static bool IsSupported(string entityType)
    {
        return Supported.Contains(entityType);
    }
}