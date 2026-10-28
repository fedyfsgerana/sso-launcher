namespace SsoLauncher.Domain.Constants;

public sealed record MenuActionDefinition(
    string MenuTarget,
    string Key,
    string Label,
    string Description
);

public static class MenuActions
{
    public const string Create = "create";
    public const string Update = "update";
    public const string Delete = "delete";
    public const string ResetPassword = "reset_password";
    public const string RevokeSessions = "revoke_sessions";
    public const string Duplicate = "duplicate";
    public const string ManageMembers = "manage_members";
    public const string ManageAccess = "manage_access";
    public const string ManageCredentials = "manage_credentials";
    public const string Reorder = "reorder";
    public const string Maintenance = "maintenance";
    public const string Export = "export";
    public const string Restore = "restore";
    public const string Rollback = "rollback";

    public static readonly IReadOnlyList<MenuActionDefinition> Catalog =
    [
        new("users", Create, "Tambah Pengguna", "Membuat pengguna baru"),
        new("users", Update, "Ubah Pengguna", "Mengubah data, termasuk aktif atau nonaktif"),
        new("users", Delete, "Hapus Pengguna", "Menghapus pengguna"),
        new("users", ResetPassword, "Atur Ulang Password", "Mengatur ulang password pengguna"),
        new("users", RevokeSessions, "Cabut Sesi", "Mencabut sesi dan membuka kunci login"),

        new("groups", Create, "Tambah Grup", "Membuat grup baru"),
        new("groups", Update, "Ubah Grup", "Mengubah data, termasuk aktif atau nonaktif"),
        new("groups", Delete, "Hapus Grup", "Menghapus grup"),
        new("groups", Duplicate, "Duplikat Grup", "Menyalin grup beserta aksesnya"),
        new("groups", ManageMembers, "Kelola Pengguna", "Menentukan pengguna dalam grup"),
        new("groups", ManageAccess, "Kelola Akses", "Menentukan akses aplikasi dan menu grup"),

        new("applications", Create, "Tambah Aplikasi", "Mendaftarkan aplikasi baru"),
        new("applications", Update, "Ubah Aplikasi", "Mengubah data, termasuk status aplikasi"),
        new("applications", Delete, "Hapus Aplikasi", "Menghapus aplikasi"),
        new("applications", ManageCredentials, "Kredensial SSO", "Membuat dan mencabut kredensial SSO"),

        new("menus", Create, "Tambah Menu", "Membuat menu atau submenu baru"),
        new("menus", Update, "Ubah Menu", "Mengubah data, termasuk aktif atau nonaktif"),
        new("menus", Delete, "Hapus Menu", "Menghapus menu"),
        new("menus", Reorder, "Urutkan Menu", "Menyusun ulang struktur menu"),
        new("menus", Maintenance, "Mode Perbaikan", "Menandai menu sedang dalam perbaikan"),

        new("audit", Export, "Ekspor Riwayat", "Mengunduh riwayat aktivitas"),
        new("audit", Restore, "Pulihkan Data", "Memulihkan data dari tempat sampah"),
        new("audit", Rollback, "Kembalikan Versi", "Mengembalikan data ke versi sebelumnya")
    ];

    public static IReadOnlyList<MenuActionDefinition> For(string menuTarget)
    {
        return Catalog
            .Where(x => x.MenuTarget == menuTarget)
            .ToList();
    }

    public static bool Exists(string menuTarget, string key)
    {
        return Catalog.Any(x => x.MenuTarget == menuTarget && x.Key == key);
    }
}
