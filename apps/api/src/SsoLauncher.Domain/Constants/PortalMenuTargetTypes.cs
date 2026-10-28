namespace SsoLauncher.Domain.Constants;

public static class PortalMenuTargetTypes
{
    public const string Page = "page";
    public const string Custom = "custom";
    public const string Url = "url";
    public const string Section = "section";

    public static readonly IReadOnlySet<string> All =
        new HashSet<string>(StringComparer.Ordinal)
        {
            Page,
            Custom,
            Url,
            Section
        };

    public static bool IsValid(string targetType)
    {
        return All.Contains(targetType);
    }
}
