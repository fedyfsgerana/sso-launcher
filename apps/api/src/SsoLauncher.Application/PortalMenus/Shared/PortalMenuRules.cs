using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.PortalMenus.Shared;

public static class PortalMenuRules
{
    public static bool IsValidDefinition(
        string label,
        string? icon,
        string targetType,
        string targetValue)
    {
        if (string.IsNullOrWhiteSpace(label) ||
            label.Length > 60)
        {
            return false;
        }

        if (icon is { Length: > 50 })
        {
            return false;
        }

        if (!PortalMenuTargetTypes.IsValid(targetType))
        {
            return false;
        }

        if (targetType == PortalMenuTargetTypes.Section)
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(targetValue) ||
            targetValue.Length > 500)
        {
            return false;
        }

        if (targetType == PortalMenuTargetTypes.Url &&
            !IsExternalUrl(targetValue))
        {
            return false;
        }

        return true;
    }

    private static bool IsExternalUrl(string value)
    {
        return Uri.TryCreate(value, UriKind.Absolute, out var uri) &&
               (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp) &&
               string.IsNullOrEmpty(uri.UserInfo);
    }

    public static bool HasCycle(
        IReadOnlyDictionary<long, long?> parentById,
        long startId)
    {
        var seen = new HashSet<long> { startId };
        var current = parentById.GetValueOrDefault(startId);

        while (current is { } parentId)
        {
            if (!seen.Add(parentId))
            {
                return true;
            }

            current = parentById.GetValueOrDefault(parentId);
        }

        return false;
    }
}
