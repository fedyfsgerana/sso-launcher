using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Http.Timeouts;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using SsoLauncher.Api.Auditing;
using SsoLauncher.Api.Authorization;
using SsoLauncher.Api.Endpoints;
using SsoLauncher.Api.Maintenance;
using SsoLauncher.Api.Security;
using SsoLauncher.Application;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Audit;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Infrastructure;
using SsoLauncher.Infrastructure.Persistence;
using SsoLauncher.Infrastructure.Persistence.Seed;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

var requestLimits = builder.Configuration.GetSection("RequestLimits");
var maxBodyBytes = requestLimits.GetValue<long>("MaxBodyBytes", 1_048_576);
var requestTimeoutSeconds = requestLimits.GetValue("TimeoutSeconds", 30);
var exportTimeoutSeconds = requestLimits.GetValue("ExportTimeoutSeconds", 120);

builder.WebHost.ConfigureKestrel(options =>
{
    options.AddServerHeader = false;
    options.Limits.MaxRequestBodySize = maxBodyBytes;
    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(15);
});

builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Extensions.Remove("exception");
        context.ProblemDetails.Extensions.Remove("traceId");
    };
});

builder.Services.AddExceptionHandler<UnhandledExceptionHandler>();

builder.Services.AddRequestTimeouts(options =>
{
    options.DefaultPolicy = new RequestTimeoutPolicy
    {
        Timeout = TimeSpan.FromSeconds(requestTimeoutSeconds),
        TimeoutStatusCode = StatusCodes.Status504GatewayTimeout
    };

    options.AddPolicy(
        "Export",
        new RequestTimeoutPolicy
        {
            Timeout = TimeSpan.FromSeconds(exportTimeoutSeconds),
            TimeoutStatusCode = StatusCodes.Status504GatewayTimeout
        }
    );
});

builder.Services.AddApplication();

builder.Services.AddInfrastructure(
    builder.Configuration
);

builder.Services.AddHostedService<AuditPartitionWorker>();
builder.Services.AddHostedService<DataRetentionWorker>();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.NumberHandling =
        JsonNumberHandling.AllowReadingFromString;
});

builder.Services.AddHttpContextAccessor();

builder.Services.AddSingleton<ClientDeviceNameResolver>();

builder.Services.AddSingleton<
    IAuditContextAccessor,
    HttpAuditContextAccessor>();

builder.Services.AddOpenApi();

var allowedOrigins =
    builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>()
    ?? [];

if (allowedOrigins.Length == 0)
{
    throw new InvalidOperationException(
        "At least one CORS allowed origin must be configured."
    );
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("Web", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var rateLimits = builder.Configuration.GetSection("RateLimiting");
var perAddressPerMinute = rateLimits.GetValue("PerAddressPerMinute", 600);
var perSessionPerMinute = rateLimits.GetValue("PerSessionPerMinute", 300);
var exportPerMinute = rateLimits.GetValue("ExportPerMinute", 10);

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode =
        StatusCodes.Status429TooManyRequests;

    options.GlobalLimiter = PartitionedRateLimiter.CreateChained(
        PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            IsRateLimitExempt(httpContext)
                ? RateLimitPartition.GetNoLimiter("exempt")
                : PerMinute(
                    $"ip:{ClientPartitionKey(httpContext)}",
                    perAddressPerMinute
                )
        ),
        PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            !IsRateLimitExempt(httpContext) &&
            SessionPartitionKey(httpContext) is { } session
                ? PerMinute(session, perSessionPerMinute)
                : RateLimitPartition.GetNoLimiter("anonymous")
        )
    );

    options.AddPolicy(
        "Export",
        httpContext => PerMinute(
            SessionPartitionKey(httpContext) ??
            $"ip:{ClientPartitionKey(httpContext)}",
            exportPerMinute
        )
    );

    options.AddPolicy(
        "Login",
        httpContext => RateLimitPartition.GetFixedWindowLimiter(
            ClientPartitionKey(httpContext),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }
        )
    );

    options.AddPolicy(
        "ServiceAuth",
        httpContext => RateLimitPartition.GetFixedWindowLimiter(
            ClientPartitionKey(httpContext),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }
        )
    );

    options.OnRejected = async (context, cancellationToken) =>
    {
        var httpContext = context.HttpContext;

        if (context.Lease.TryGetMetadata(
                MetadataName.RetryAfter,
                out var retryAfter))
        {
            httpContext.Response.Headers.RetryAfter =
                ((int)Math.Ceiling(retryAfter.TotalSeconds)).ToString();
        }

        if (!httpContext.Request.Path.StartsWithSegments("/api/auth/login"))
        {
            return;
        }

        var auditLogger =
            httpContext.RequestServices
                .GetRequiredService<AuditLogger>();

        auditLogger.Record(
            null,
            "Tidak dikenal",
            AuditActions.LoginFailed,
            AuditTargets.Session,
            null,
            ClientPartitionKey(httpContext),
            "Login ditolak: terlalu banyak percobaan dari alamat ini",
            outcome: AuditOutcomes.Failed
        );

        await auditLogger.SaveAsync(cancellationToken);
    };
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    var problems = ProductionConfigurationCheck.Problems(app.Configuration);

    if (problems.Count > 0)
    {
        throw new InvalidOperationException(
            "Pengaturan produksi belum aman:" +
            Environment.NewLine +
            string.Join(Environment.NewLine, problems.Select(item => $"- {item}"))
        );
    }

    foreach (var warning in ProductionConfigurationCheck.Warnings(app.Configuration))
    {
        app.Logger.LogWarning("{Warning}", warning);
    }
}

if (app.Environment.IsDevelopment())
{
    DevelopmentDatabaseGuard.EnsureLocalDatabase(app.Configuration);

    app.MapOpenApi();

    app.MapScalarApiReference(options =>
    {
        options.WithTitle("SSO Launcher API");
    });

    await using var scope =
        app.Services.CreateAsyncScope();

    var dbContext =
        scope.ServiceProvider
            .GetRequiredService<
                SsoLauncherDbContext>();

    await dbContext.Database.MigrateAsync();

    var seeder =
        scope.ServiceProvider
            .GetRequiredService<
                DevelopmentDataSeeder>();

    await seeder.SeedAsync();

    if (args.Contains("--seed-demo-applications") || args.Contains("--clear-demo-applications"))
    {
        var demo =
            scope.ServiceProvider
                .GetRequiredService<
                    DemoApplicationSeeder>();

        if (args.Contains("--clear-demo-applications"))
        {
            await demo.ClearAsync();
        }
        else
        {
            await demo.SeedAsync();
            await seeder.SeedAsync();
        }

        return;
    }

    if (args.Contains("--seed-load-test") || args.Contains("--clear-load-test"))
    {
        var loadTest =
            scope.ServiceProvider
                .GetRequiredService<
                    LoadTestSeeder>();

        if (args.Contains("--clear-load-test"))
        {
            await loadTest.ClearAsync();
        }
        else
        {
            await loadTest.SeedAsync();
        }

        return;
    }
}
else
{
    await using var scope =
        app.Services.CreateAsyncScope();

    var bootstrapper =
        scope.ServiceProvider
            .GetRequiredService<
                PortalBootstrapper>();

    await bootstrapper.RunAsync();
}

app.UseExceptionHandler();

app.UseForwardedHeaders(
    ForwardedHeadersConfiguration.Create(app.Configuration)
);

app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<RequestSizeLimitMiddleware>(maxBodyBytes);

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseCors("Web");
app.UseMiddleware<AuditContextMiddleware>();
app.UseRateLimiter();
app.UseRequestTimeouts();

app.MapHealthEndpoints();
app.MapAuthEndpoints();
app.MapApplicationEndpoints();
app.MapApplicationManagementEndpoints();
app.MapUserEndpoints();
app.MapDepartmentEndpoints();
app.MapAuditEndpoints();
app.MapDataVersionEndpoints();
app.MapRecycleBinEndpoints();
app.MapUserGroupEndpoints();
app.MapPortalMenuEndpoints();
app.MapFavoriteEndpoints();
app.MapActivityEndpoints();
app.MapOverviewEndpoints();
app.MapNotificationEndpoints();
app.MapAccountEndpoints();
app.MapDirectoryEndpoints();
app.MapSsoEndpoints();
app.MapServiceAuthEndpoints();
app.MapServiceCredentialEndpoints();

app.Run();

static string ClientPartitionKey(HttpContext httpContext)
{
    var address = httpContext.Connection.RemoteIpAddress;

    if (address is { IsIPv4MappedToIPv6: true })
    {
        address = address.MapToIPv4();
    }

    return address?.ToString() ?? "unknown";
}

static string? SessionPartitionKey(HttpContext httpContext)
{
    var session = httpContext.Request.Cookies[
        PortalAuthorization.SessionCookieName
    ];

    if (string.IsNullOrEmpty(session))
    {
        return null;
    }

    var hash = SHA256.HashData(Encoding.UTF8.GetBytes(session));

    return $"session:{Convert.ToHexString(hash, 0, 16)}";
}

static bool IsRateLimitExempt(HttpContext httpContext)
{
    return httpContext.Request.Path.StartsWithSegments("/health");
}

static RateLimitPartition<string> PerMinute(string key, int permitLimit)
{
    return RateLimitPartition.GetFixedWindowLimiter(
        key,
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = Math.Max(1, permitLimit),
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        }
    );
}

public partial class Program;
