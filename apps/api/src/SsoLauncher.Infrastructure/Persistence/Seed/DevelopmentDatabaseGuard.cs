using Microsoft.Extensions.Configuration;
using Npgsql;

namespace SsoLauncher.Infrastructure.Persistence.Seed;

public static class DevelopmentDatabaseGuard
{
    public const string AllowRemoteKey = "DevelopmentSeeder:AllowRemoteDatabase";

    private static readonly HashSet<string> LocalHosts =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "localhost",
            "127.0.0.1",
            "::1",
            "[::1]"
        };

    public static void EnsureLocalDatabase(IConfiguration configuration)
    {
        if (bool.TryParse(configuration[AllowRemoteKey], out var allowRemote) &&
            allowRemote)
        {
            return;
        }

        var connectionString =
            configuration.GetConnectionString("PostgreSql") ?? string.Empty;

        var host = new NpgsqlConnectionStringBuilder(connectionString).Host;

        if (string.IsNullOrWhiteSpace(host))
        {
            return;
        }

        var remoteHosts = host
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(StripPort)
            .Where(x => !x.StartsWith('/') && !LocalHosts.Contains(x))
            .ToList();

        if (remoteHosts.Count == 0)
        {
            return;
        }

        throw new InvalidOperationException(
            $"API berjalan dalam mode Development tetapi terhubung ke database di '{string.Join(", ", remoteHosts)}'. " +
            "Mode Development menjalankan migrasi otomatis dan seeder yang mereset password administrator, " +
            "jadi hanya boleh memakai database lokal. Untuk server, jalankan dengan ASPNETCORE_ENVIRONMENT=Production. " +
            $"Kalau database development memang berada di komputer lain, isi {AllowRemoteKey}=true."
        );
    }

    private static string StripPort(string host)
    {
        if (host.StartsWith('['))
        {
            var end = host.IndexOf(']');

            return end > 0 ? host[..(end + 1)] : host;
        }

        return host.Count(c => c == ':') == 1 ? host.Split(':')[0] : host;
    }
}
