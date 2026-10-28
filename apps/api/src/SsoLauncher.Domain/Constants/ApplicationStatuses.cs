namespace SsoLauncher.Domain.Constants;

public static class ApplicationStatuses
{
    public const string Active = "active";
    public const string Maintenance = "maintenance";
    public const string Inactive = "inactive";

    public static readonly IReadOnlySet<string> All =
        new HashSet<string>(StringComparer.Ordinal)
        {
            Active,
            Maintenance,
            Inactive
        };

    public static bool IsValid(string status)
    {
        return All.Contains(status);
    }

    public static string Label(string status)
    {
        return status switch
        {
            Active => "Aktif",
            Maintenance => "Maintenance",
            Inactive => "Nonaktif",
            _ => status
        };
    }

    public static bool IsLaunchable(string status)
    {
        return status == Active;
    }
}
