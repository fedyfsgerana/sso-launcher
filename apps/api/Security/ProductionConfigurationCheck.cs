namespace SsoLauncher.Api.Security;

public static class ProductionConfigurationCheck
{
    private const int MinimumKeyLength = 32;

    private static readonly string[] LocalHosts =
    [
        "localhost",
        "127.0.0.1",
        "[::1]"
    ];

    public static IReadOnlyList<string> Problems(IConfiguration configuration)
    {
        var problems = new List<string>();
        var ssoKey = configuration["SsoToken:SigningKey"] ?? "";
        var serviceKey = configuration["ServiceAccessToken:SigningKey"] ?? "";

        if (ssoKey.Trim().Length < MinimumKeyLength)
        {
            problems.Add(
                $"SsoToken:SigningKey wajib diisi minimal {MinimumKeyLength} karakter acak."
            );
        }

        if (serviceKey.Trim().Length < MinimumKeyLength)
        {
            problems.Add(
                $"ServiceAccessToken:SigningKey wajib diisi minimal {MinimumKeyLength} karakter acak."
            );
        }

        if (ssoKey.Length > 0 && ssoKey == serviceKey)
        {
            problems.Add(
                "SsoToken:SigningKey dan ServiceAccessToken:SigningKey harus berbeda."
            );
        }

        var hosts = (configuration["AllowedHosts"] ?? "")
            .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (hosts.Length == 0 || hosts.Contains("*"))
        {
            problems.Add(
                "AllowedHosts wajib berisi nama domain API, misalnya sso-api.example.com, bukan kosong atau *."
            );
        }
        else if (hosts.Any(IsLocalHost))
        {
            problems.Add(
                "AllowedHosts masih berisi localhost. Ganti dengan nama domain API produksi."
            );
        }

        var origins = configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? [];

        foreach (var origin in origins)
        {
            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri) ||
                uri.Scheme != Uri.UriSchemeHttps ||
                IsLocalHost(uri.Host))
            {
                problems.Add(
                    $"Cors:AllowedOrigins berisi '{origin}'. Di produksi hanya alamat https web portal yang boleh."
                );
            }
        }

        return problems;
    }

    public static IReadOnlyList<string> Warnings(IConfiguration configuration)
    {
        var warnings = new List<string>();
        var proxies = Filled(configuration, "ForwardedHeaders:KnownProxies");
        var networks = Filled(configuration, "ForwardedHeaders:KnownNetworks");

        if (proxies.Count == 0 && networks.Count == 0)
        {
            warnings.Add(
                "ForwardedHeaders:KnownProxies kosong. Kalau API berada di belakang IIS, Nginx, atau load balancer, isi alamatnya supaya batas login dihitung per pengguna, bukan per proxy."
            );
        }

        if (!string.IsNullOrWhiteSpace(configuration["Bootstrap:Password"]))
        {
            warnings.Add(
                "Pengaturan Bootstrap masih berisi password. Hapus seluruh pengaturan Bootstrap setelah akun administrator pertama dibuat dan passwordnya diganti."
            );
        }

        return warnings;
    }

    private static List<string> Filled(IConfiguration configuration, string key)
    {
        return configuration
            .GetSection(key)
            .GetChildren()
            .Select(child => child.Value)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value!)
            .ToList();
    }

    private static bool IsLocalHost(string host)
    {
        return LocalHosts.Contains(host, StringComparer.OrdinalIgnoreCase) ||
               host.Equals("::1", StringComparison.Ordinal);
    }
}
