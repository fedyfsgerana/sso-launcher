namespace SsoLauncher.Infrastructure.Persistence.Seed;

public sealed record PortalMenuDefault(
    string Label,
    string Icon,
    string TargetType,
    string TargetValue,
    int SortOrder,
    bool IsSystem,
    string? SectionKey);

public static class PortalMenuDefaults
{
    public const string PortalSection = "portal";
    public const string ManagementSection = "management";
    public const string SystemSection = "system";

    public static readonly PortalMenuDefault[] Sections =
    [
        new("Portal", "", "section", PortalSection, 0, true, null),
        new("Manajemen", "", "section", ManagementSection, 1, true, null),
        new("Sistem", "", "section", SystemSection, 2, true, null)
    ];

    public static readonly PortalMenuDefault[] All =
    [
        new("Beranda", "home", "page", "overview", 0, true, PortalSection),
        new("Aplikasi Saya", "grid", "page", "my-apps", 1, false, PortalSection),
        new("Favorit", "star", "page", "favorites", 2, false, PortalSection),
        new("Terbaru", "clock", "page", "recent", 3, false, PortalSection),
        new("Pengguna", "users", "page", "users", 0, false, ManagementSection),
        new("Grup & Akses", "shield", "page", "groups", 1, false, ManagementSection),
        new("Aplikasi", "window", "page", "applications", 2, false, ManagementSection),
        new("Menu", "list", "page", "menus", 3, true, ManagementSection),
        new("Riwayat Aktivitas", "history", "page", "audit", 0, false, SystemSection)
    ];
}
