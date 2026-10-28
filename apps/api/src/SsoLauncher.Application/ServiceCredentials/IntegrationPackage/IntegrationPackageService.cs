using System.Text;
using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.ServiceCredentials.IntegrationPackage;

public sealed record IntegrationPackageTemplate(string FileName, string Content);

public sealed record PortalAddresses(string WebUrl, string ApiUrl);

public enum IntegrationGuideOutcome
{
    Ready,
    NotFound,
    AlreadyDownloaded,
    Expired
}

public sealed record IntegrationGuideResult(
    IntegrationGuideOutcome Outcome,
    IntegrationPackageTemplate? Template = null);

public sealed class IntegrationPackageService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditScope auditScope)
{
    public static readonly TimeSpan DownloadWindow = TimeSpan.FromHours(1);

    public const string FileNamePrefix = "SSO Launcher - SSO Integration";

    public const string ClientIdPlaceholder = "{{PORTAL_CLIENT_ID}}";

    public const string ClientSecretPlaceholder = "{{PORTAL_CLIENT_SECRET}}";

    public async Task<IntegrationGuideResult> ClaimAsync(
        long credentialId,
        PortalAddresses portal,
        string guide,
        CancellationToken cancellationToken = default)
    {
        var credential = await dbContext.ApplicationServiceCredentials
            .Include(x => x.Application)
            .SingleOrDefaultAsync(x => x.Id == credentialId, cancellationToken);

        if (credential is null ||
            !credential.Application.IsActive ||
            !credential.Application.UsesSso)
        {
            return new IntegrationGuideResult(IntegrationGuideOutcome.NotFound);
        }

        if (credential.GuideDownloadedAt is not null)
        {
            return new IntegrationGuideResult(IntegrationGuideOutcome.AlreadyDownloaded);
        }

        var now = DateTimeOffset.UtcNow;

        if (!credential.IsActive ||
            credential.LastUsedAt is not null ||
            now - credential.CreatedAt > DownloadWindow)
        {
            return new IntegrationGuideResult(IntegrationGuideOutcome.Expired);
        }

        credential.GuideDownloadedAt = now;
        credential.UpdatedAt = now;

        auditLogger.Record(
            auditScope.ActorId,
            auditScope.ActorName,
            AuditActions.Update,
            AuditTargets.ServiceCredential,
            credential.Id,
            $"{credential.Application.Name} - {credential.ClientId}",
            "Panduan integrasi SSO diunduh"
        );

        await dbContext.SaveChangesAsync(cancellationToken);

        return new IntegrationGuideResult(
            IntegrationGuideOutcome.Ready,
            Build(credential.Application, portal, guide)
        );
    }

    private static IntegrationPackageTemplate Build(
        SsoLauncher.Domain.Entities.Application application,
        PortalAddresses portal,
        string guide)
    {
        var appUrl = string.IsNullOrWhiteSpace(application.AppUrl)
            ? application.LaunchUrl
            : application.AppUrl;

        var content = new StringBuilder()
            .AppendLine($"# SSO Launcher — SSO Integration: {application.Name}")
            .AppendLine()
            .AppendLine("> **RAHASIA.** File ini berisi Client Secret. Simpan di tempat aman, serahkan hanya ke penanggung jawab server aplikasi, dan jangan kirim lewat grup chat atau email biasa. Kalau bocor atau hilang, minta kredensial baru ke admin SSO Launcher.")
            .AppendLine()
            .AppendLine("## 1. Kredensial SSO")
            .AppendLine()
            .AppendLine("| Data | Nilai |")
            .AppendLine("|---|---|")
            .AppendLine($"| Client ID | `{ClientIdPlaceholder}` |")
            .AppendLine($"| Client Secret | `{ClientSecretPlaceholder}` |")
            .AppendLine()
            .AppendLine("Client Secret hanya ditampilkan sekali oleh SSO Launcher dan tidak bisa dilihat lagi. Simpan di penyimpan rahasia server aplikasi.")
            .AppendLine()
            .AppendLine("## 2. Data Aplikasi")
            .AppendLine()
            .AppendLine("| Data | Nilai |")
            .AppendLine("|---|---|")
            .AppendLine($"| Nama aplikasi | {application.Name} |")
            .AppendLine($"| Slug | `{application.Slug}` |")
            .AppendLine($"| Alamat aplikasi | `{appUrl}` |")
            .AppendLine($"| Alamat callback SSO yang **wajib** disediakan aplikasi | `{application.LaunchUrl}` |")
            .AppendLine()
            .AppendLine("## 3. Pengaturan Server Aplikasi")
            .AppendLine()
            .AppendLine("Pasang di pengaturan **server** aplikasi (variabel lingkungan atau penyimpan rahasia). Jangan simpan di kode, git, atau frontend.")
            .AppendLine()
            .AppendLine("```env")
            .AppendLine($"PORTAL_WEB_URL={portal.WebUrl}")
            .AppendLine($"PORTAL_API_URL={portal.ApiUrl}")
            .AppendLine($"PORTAL_APP_SLUG={application.Slug}")
            .AppendLine($"PORTAL_CLIENT_ID={ClientIdPlaceholder}")
            .AppendLine($"PORTAL_CLIENT_SECRET={ClientSecretPlaceholder}")
            .AppendLine("```")
            .AppendLine()
            .AppendLine("## 4. Yang Harus Dikerjakan Tim Aplikasi")
            .AppendLine()
            .AppendLine($"1. Sediakan halaman callback di `{application.LaunchUrl}` yang memvalidasi `sso_token` dari **server** aplikasi, sesuai panduan di bawah.")
            .AppendLine($"2. Pastikan `applicationSlug` dari portal sama dengan `{application.Slug}`.")
            .AppendLine($"3. Pengguna tanpa sesi dialihkan ke `{portal.WebUrl}/launch/{application.Slug}?to=/halaman`.")
            .AppendLine($"4. Tombol Keluar mengakhiri sesi aplikasi lalu mengalihkan ke `{portal.WebUrl}/signed-out/{application.Slug}`.")
            .AppendLine("5. Periksa sesi portal paling cepat tiap 5 menit lewat `POST /api/sso/session` dengan `keepAlive: true`.")
            .AppendLine("6. Hapus halaman login dan form password milik aplikasi sendiri.")
            .AppendLine("7. Kabari admin SSO Launcher setelah terpasang, supaya akses grup bisa diberikan dan diuji bersama.")
            .AppendLine()
            .AppendLine("## 5. Daftar Uji Sebelum Dipakai Pengguna")
            .AppendLine()
            .AppendLine("1. Klik **Buka** di portal langsung masuk ke aplikasi tanpa login ulang.")
            .AppendLine("2. Mengetik alamat aplikasi tanpa sesi diarahkan ke portal, lalu kembali ke halaman yang dituju.")
            .AppendLine("3. Membuka alamat callback dengan token lama atau palsu ditolak.")
            .AppendLine("4. Keluar dari aplikasi kembali ke Beranda portal tanpa login ulang.")
            .AppendLine("5. Keluar dari portal membuat aplikasi ikut keluar paling lambat 5 menit kemudian.")
            .AppendLine("6. Pengguna yang aksesnya dicabut di portal tidak bisa masuk lagi.")
            .AppendLine()
            .AppendLine("---")
            .AppendLine()
            .AppendLine("## 6. Panduan Lengkap Integrasi SSO")
            .AppendLine()
            .AppendLine(guide.Trim())
            .ToString();

        return new IntegrationPackageTemplate(FileNameFor(application.Name), content);
    }

    public static string FileNameFor(string applicationName)
    {
        var invalid = Path.GetInvalidFileNameChars()
            .Concat(['<', '>', ':', '"', '/', '\\', '|', '?', '*'])
            .ToHashSet();

        var name = new string(applicationName
                .Select(character => invalid.Contains(character) || char.IsControl(character) ? ' ' : character)
                .ToArray())
            .Trim();

        name = string.Join(' ', name.Split(' ', StringSplitOptions.RemoveEmptyEntries));

        return string.IsNullOrEmpty(name)
            ? $"{FileNamePrefix}.md"
            : $"{FileNamePrefix} {name}.md";
    }
}
