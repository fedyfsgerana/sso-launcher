using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Infrastructure.Persistence;
using SsoLauncher.Infrastructure.Persistence.Maintenance;
using SsoLauncher.Infrastructure.Persistence.Seed;
using SsoLauncher.Infrastructure.Security;

namespace SsoLauncher.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<SsoLauncherDbContext>(
            (serviceProvider, options) =>
            {
                var currentConfiguration =
                    serviceProvider
                        .GetRequiredService<IConfiguration>();

                var connectionString =
                    currentConfiguration
                        .GetConnectionString("PostgreSql")
                    ?? throw new InvalidOperationException(
                        "Connection string 'PostgreSql' was not found."
                    );

                options.UseNpgsql(
                    connectionString,
                    npgsqlOptions =>
                    {
                        npgsqlOptions.MigrationsAssembly(
                            typeof(SsoLauncherDbContext)
                                .Assembly
                                .FullName
                        );

                        npgsqlOptions.UseQuerySplittingBehavior(
                            QuerySplittingBehavior.SplitQuery
                        );

                        npgsqlOptions.MigrationsHistoryTable(
                            "__ef_migrations_history"
                        );
                    }
                );
            }
        );

        services.AddScoped<ISsoLauncherDbContext>(
            serviceProvider =>
                serviceProvider.GetRequiredService<
                    SsoLauncherDbContext>()
        );

        services.AddScoped<DevelopmentDataSeeder>();
        services.AddScoped<LoadTestSeeder>();
        services.AddScoped<DemoApplicationSeeder>();
        services.AddScoped<PortalBootstrapper>();

        services.AddOptions<DataRetentionOptions>()
            .Configure<IConfiguration>(
                (options, currentConfiguration) =>
                {
                    var section =
                        currentConfiguration.GetSection(
                            DataRetentionOptions.SectionName
                        );

                    if (bool.TryParse(section["Enabled"], out var enabled))
                    {
                        options.Enabled = enabled;
                    }

                    if (int.TryParse(section["AuditLogMonths"], out var auditMonths))
                    {
                        options.AuditLogMonths = auditMonths;
                    }

                    if (int.TryParse(section["DataVersionMonths"], out var versionMonths))
                    {
                        options.DataVersionMonths = versionMonths;
                    }

                    if (int.TryParse(section["ActivityMonths"], out var activityMonths))
                    {
                        options.ActivityMonths = activityMonths;
                    }

                    if (int.TryParse(section["NotificationMonths"], out var notificationMonths))
                    {
                        options.NotificationMonths = notificationMonths;
                    }

                    if (int.TryParse(section["BatchSize"], out var batchSize))
                    {
                        options.BatchSize = batchSize;
                    }

                    if (int.TryParse(section["MaxBatchesPerRun"], out var maxBatches))
                    {
                        options.MaxBatchesPerRun = maxBatches;
                    }

                    if (int.TryParse(section["IntervalHours"], out var intervalHours))
                    {
                        options.IntervalHours = intervalHours;
                    }
                }
            );

        services.AddScoped<AuditPartitionService>();
        services.AddScoped<DataRetentionService>();

        services.AddOptions<SessionOptions>()
            .Configure<IConfiguration>(
                (options, currentConfiguration) =>
                {
                    var section =
                        currentConfiguration.GetSection(
                            SessionOptions.SectionName
                        );

                    if (int.TryParse(
                            section["LifetimeHours"],
                            out var lifetimeHours))
                    {
                        options.LifetimeHours =
                            Math.Max(1, lifetimeHours);
                    }

                    if (int.TryParse(
                            section["IdleMinutes"],
                            out var idleMinutes))
                    {
                        options.IdleMinutes =
                            Math.Max(1, idleMinutes);
                    }
                }
            );

        services.AddOptions<SsoTokenOptions>()
            .Configure<IConfiguration>(
                (options, currentConfiguration) =>
                {
                    var section =
                        currentConfiguration.GetSection(
                            SsoTokenOptions.SectionName
                        );

                    options.Issuer =
                        section["Issuer"]
                        ?? throw new InvalidOperationException(
                            "SSO token issuer is not configured."
                        );

                    options.SigningKey =
                        section["SigningKey"]
                        ?? throw new InvalidOperationException(
                            "SSO token signing key is not configured."
                        );

                    if (int.TryParse(
                            section["LifetimeSeconds"],
                            out var lifetimeSeconds))
                    {
                        options.LifetimeSeconds =
                            Math.Max(1, lifetimeSeconds);
                    }
                }
            );

        services.AddOptions<ServiceAccessTokenOptions>()
            .Configure<IConfiguration>(
                (options, currentConfiguration) =>
                {
                    var section =
                        currentConfiguration.GetSection(
                            ServiceAccessTokenOptions.SectionName
                        );

                    options.Issuer =
                        section["Issuer"]
                        ?? throw new InvalidOperationException(
                            "Service access token issuer is not configured."
                        );

                    options.SigningKey =
                        section["SigningKey"]
                        ?? throw new InvalidOperationException(
                            "Service access token signing key is not configured."
                        );

                    if (int.TryParse(
                            section["LifetimeSeconds"],
                            out var lifetimeSeconds))
                    {
                        options.LifetimeSeconds =
                            Math.Max(1, lifetimeSeconds);
                    }
                }
            );

        services.AddOptions<LoginLockoutOptions>()
            .Configure<IConfiguration>(
                (options, currentConfiguration) =>
                {
                    var section =
                        currentConfiguration.GetSection(
                            LoginLockoutOptions.SectionName
                        );

                    if (int.TryParse(
                            section["MaxFailuresPerAddress"],
                            out var perAddress))
                    {
                        options.MaxFailuresPerAddress = perAddress;
                    }

                    if (int.TryParse(
                            section["MaxFailuresPerAccount"],
                            out var perAccount))
                    {
                        options.MaxFailuresPerAccount = perAccount;
                    }

                    if (int.TryParse(
                            section["WindowMinutes"],
                            out var windowMinutes))
                    {
                        options.WindowMinutes = windowMinutes;
                    }
                }
            );

        services.AddSingleton<
            ILoginLockoutPolicy,
            LoginLockoutPolicy>();

        services.AddSingleton<
            IPasswordHasher,
            PasswordHasher>();

        services.AddSingleton<
            ISessionTokenService,
            SessionTokenService>();

        services.AddSingleton<
            ISessionLifetimeProvider,
            SessionLifetimeProvider>();

        services.AddSingleton<
            ISsoTokenService,
            SsoTokenService>();

        services.AddMemoryCache();

        services.AddScoped<
            ISsoTokenReplayGuard,
            DatabaseSsoTokenReplayGuard>();

        services.AddSingleton<
            ISsoTokenLifetimeProvider,
            SsoTokenLifetimeProvider>();

        services.AddSingleton<
            IServiceAccessTokenService,
            ServiceAccessTokenService>();

        services.AddSingleton<
            IServiceAccessTokenLifetimeProvider,
            ServiceAccessTokenLifetimeProvider>();

        services.AddSingleton<
            ICsrfTokenService,
            CsrfTokenService>();

        return services;
    }
}
