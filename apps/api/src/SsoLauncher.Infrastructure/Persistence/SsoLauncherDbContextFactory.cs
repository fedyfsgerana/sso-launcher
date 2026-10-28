using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using SsoLauncher.Application.Abstractions.Auditing;

namespace SsoLauncher.Infrastructure.Persistence;

public sealed class SsoLauncherDbContextFactory
    : IDesignTimeDbContextFactory<SsoLauncherDbContext>
{
    public SsoLauncherDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable(
                "ConnectionStrings__PostgreSql"
            );

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            connectionString = GetDevelopmentConnectionString();
        }

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "PostgreSQL connection string is not configured."
            );
        }

        var optionsBuilder =
        new DbContextOptionsBuilder<SsoLauncherDbContext>();

        optionsBuilder.UseNpgsql(
            connectionString,
            npgsqlOptions =>
                npgsqlOptions.MigrationsHistoryTable(
                    "__ef_migrations_history"
                )
        );

        return new SsoLauncherDbContext(
            optionsBuilder.Options,
            new AuditScope()
        );
    }

    private static string? GetDevelopmentConnectionString()
    {
        var appSettingsPath =
            FindDevelopmentAppSettings();

        if (appSettingsPath is null)
        {
            return null;
        }

        using var stream =
            File.OpenRead(appSettingsPath);

        using var document =
            JsonDocument.Parse(stream);

        if (!document.RootElement.TryGetProperty(
                "ConnectionStrings",
                out var connectionStrings
            ))
        {
            return null;
        }

        if (!connectionStrings.TryGetProperty(
                "PostgreSql",
                out var postgreSql
            ))
        {
            return null;
        }

        return postgreSql.GetString();
    }

    private static string? FindDevelopmentAppSettings()
    {
        var currentDirectory =
            new DirectoryInfo(
                Directory.GetCurrentDirectory()
            );

        while (currentDirectory is not null)
        {
            var directPath =
                Path.Combine(
                    currentDirectory.FullName,
                    "appsettings.Development.json"
                );

            if (File.Exists(directPath))
            {
                return directPath;
            }

            var apiPath =
                Path.Combine(
                    currentDirectory.FullName,
                    "apps",
                    "api",
                    "appsettings.Development.json"
                );

            if (File.Exists(apiPath))
            {
                return apiPath;
            }

            currentDirectory =
                currentDirectory.Parent;
        }

        return null;
    }
}
