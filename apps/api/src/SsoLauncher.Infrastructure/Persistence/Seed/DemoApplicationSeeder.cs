#nullable enable

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace SsoLauncher.Infrastructure.Persistence.Seed;

public sealed class DemoApplicationSeeder(
    SsoLauncherDbContext dbContext,
    ILogger<DemoApplicationSeeder> logger)
{
    public const int ApplicationCount = 35;

    private const string SlugPrefix = "demo-";

    private static readonly (string Name, string Icon)[] Catalog =
    [
        ("Absensi Karyawan", "fingerprint"),
        ("Penggajian", "wallet"),
        ("Rekrutmen", "usercheck"),
        ("Cuti & Izin", "calendarcheck"),
        ("Penilaian Kinerja", "award"),
        ("Pelatihan Karyawan", "book"),
        ("Gudang Bahan Baku", "warehouse"),
        ("Gudang Barang Jadi", "package"),
        ("Stok Opname", "clipboardcheck"),
        ("Pengiriman Barang", "truck"),
        ("Ekspor & Kontainer", "container"),
        ("Pembelian", "cart"),
        ("Vendor & Supplier", "handshake"),
        ("Kas & Bank", "banknote"),
        ("Hutang Piutang", "receipt"),
        ("Anggaran", "piggy"),
        ("Laporan Keuangan", "chart"),
        ("Aset Tetap", "landmark"),
        ("Perencanaan Produksi", "calendarclock"),
        ("Monitoring Produksi", "factory"),
        ("Hasil Produksi Harian", "gauge"),
        ("Pemeliharaan Mesin", "wrench"),
        ("Work Order Teknik", "hammer"),
        ("Inspeksi Mutu", "beaker"),
        ("Uji Laboratorium", "flask"),
        ("Keluhan Pelanggan", "headset"),
        ("Dokumen ISO", "files"),
        ("Audit Internal", "listchecks"),
        ("Penerimaan Bahan Baku", "sprout"),
        ("Timbangan Truk", "scale"),
        ("Data Pemasok", "users"),
        ("Penjualan", "store"),
        ("Order Pelanggan", "notebookpen"),
        ("Helpdesk IT", "lifebuoy"),
        ("Inventaris IT", "laptop"),
        ("Booking Ruang Rapat", "building"),
        ("Kendaraan Operasional", "car"),
        ("Kantin & Katering", "utensils"),
        ("K3 & Keselamatan Kerja", "hardhat"),
        ("Dashboard Direksi", "dash")
    ];

    private static readonly string[] Categories =
    [
        "Information Technology",
        "Human Resources",
        "Finance",
        "General Affairs",
        "Operations",
        "Marketing",
        "Purchasing",
        "Production",
        "Quality Control",
        "Management",
        "Lintas Departemen",
        "Lainnya"
    ];

    private static readonly string[] Colors =
    [
        "app-hr", "app-wh", "app-pr", "app-pj", "app-as", "app-dc",
        "app-fn", "app-hd", "app-nv", "app-vi", "app-br", "app-gy"
    ];

    private static readonly string[] MaintenanceMessages =
    [
        "Perbaikan server sampai pukul 15.00",
        "Pembaruan versi aplikasi, kembali normal besok pagi",
        "Migrasi database, mohon tunggu sekitar 2 jam"
    ];

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.Applications
            .IgnoreQueryFilters()
            .CountAsync(x => x.Slug.StartsWith(SlugPrefix), cancellationToken);

        if (existing > 0)
        {
            logger.LogWarning(
                "Aplikasi demo sudah ada ({Count}). Hapus dulu dengan --clear-demo-applications.",
                existing
            );
            return;
        }

        var random = new Random();
        var now = DateTimeOffset.UtcNow;
        var picked = Catalog
            .OrderBy(_ => random.Next())
            .Take(ApplicationCount)
            .ToList();

        foreach (var (name, icon) in picked)
        {
            var slug = SlugPrefix + Slugify(name);
            var createdAt = now.AddDays(-random.Next(0, 365)).AddMinutes(-random.Next(0, 1440));
            var roll = random.Next(100);
            var status = roll < 80 ? "active" : roll < 90 ? "maintenance" : "inactive";
            var category = Categories[random.Next(Categories.Length)];

            var updatedAt = createdAt.AddDays(random.Next(0, 30));

            dbContext.Applications.Add(new SsoLauncher.Domain.Entities.Application
            {
                Name = name,
                Slug = slug,
                Description = $"Aplikasi {name.ToLowerInvariant()} untuk {category}.",
                LaunchUrl = $"https://{slug}.example.test",
                Category = category,
                Icon = icon,
                Color = Colors[random.Next(Colors.Length)],
                Status = status,
                MaintenanceMessage = status == "maintenance"
                    ? MaintenanceMessages[random.Next(MaintenanceMessages.Length)]
                    : string.Empty,
                UsesSso = random.Next(100) < 75,
                IsActive = status != "inactive",
                CreatedAt = createdAt,
                UpdatedAt = updatedAt > now ? now : updatedAt
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "{Count} aplikasi demo dibuat dengan awalan slug {Prefix}.",
            picked.Count,
            SlugPrefix
        );
    }

    public async Task ClearAsync(CancellationToken cancellationToken = default)
    {
        var ids = dbContext.Applications
            .IgnoreQueryFilters()
            .Where(x => x.Slug.StartsWith(SlugPrefix))
            .Select(x => x.Id);

        await dbContext.UserGroupApplicationAccesses
            .IgnoreQueryFilters()
            .Where(x => ids.Contains(x.ApplicationId))
            .ExecuteDeleteAsync(cancellationToken);

        await dbContext.ApplicationFavorites
            .IgnoreQueryFilters()
            .Where(x => ids.Contains(x.ApplicationId))
            .ExecuteDeleteAsync(cancellationToken);

        await dbContext.ApplicationServiceCredentials
            .IgnoreQueryFilters()
            .Where(x => ids.Contains(x.ApplicationId))
            .ExecuteDeleteAsync(cancellationToken);

        await dbContext.PortalActivities
            .IgnoreQueryFilters()
            .Where(x => x.ApplicationId != null && ids.Contains(x.ApplicationId.Value))
            .ExecuteDeleteAsync(cancellationToken);

        var removed = await dbContext.Applications
            .IgnoreQueryFilters()
            .Where(x => x.Slug.StartsWith(SlugPrefix))
            .ExecuteDeleteAsync(cancellationToken);

        logger.LogInformation("{Count} aplikasi demo dihapus.", removed);
    }

    private static string Slugify(string name)
    {
        var chars = name
            .ToLowerInvariant()
            .Select(c => char.IsLetterOrDigit(c) ? c : '-')
            .ToArray();

        return string.Join(
            '-',
            new string(chars).Split('-', StringSplitOptions.RemoveEmptyEntries)
        );
    }
}
