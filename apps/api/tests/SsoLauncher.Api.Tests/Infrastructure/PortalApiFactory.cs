using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using SsoLauncher.Infrastructure.Persistence;

namespace SsoLauncher.Api.Tests.Infrastructure;

public sealed class PortalApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public const string AdministratorEmail = "administrator@example.com";
    public const string AdministratorPassword = "p@ssw0rd";
    public const string AdministratorGroupName = "Administrator";

    private const string CsrfCookieName = "sso_launcher_csrf";


    private static readonly IReadOnlyDictionary<string, string> Settings =
        new Dictionary<string, string>
        {
            ["SsoToken__SigningKey"] = "sso-launcher-test-sso-signing-key-0123456789abcdef",
            ["ServiceAccessToken__SigningKey"] = "sso-launcher-test-service-signing-key-0123456789abcdef",
            ["DataRetention__Enabled"] = "false",
            ["RateLimiting__PerAddressPerMinute"] = "100000",
            ["RateLimiting__PerSessionPerMinute"] = "100000",
            ["RateLimiting__ExportPerMinute"] = "3"
        };

    private PortalSession? administrator;

    public string ConnectionString { get; } = TestDatabase.ResolveConnectionString();

    public async ValueTask InitializeAsync()
    {
        await TestDatabase.RecreateAsync(
            ConnectionString,
            TestContext.Current.CancellationToken
        );

        Environment.SetEnvironmentVariable(
            "ConnectionStrings__PostgreSql",
            ConnectionString
        );

        foreach (var (key, value) in Settings)
        {
            Environment.SetEnvironmentVariable(key, value);
        }

        _ = Server;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureServices(services =>
        {
            services.AddSingleton<IStartupFilter, TestClientAddressStartupFilter>();
            services.AddSingleton<IStartupFilter, FailingEndpointStartupFilter>();
        });
    }

    public HttpClient CreateClientFrom(string address)
    {
        var client = CreateClient();

        client.DefaultRequestHeaders.Add(
            TestClientAddressStartupFilter.HeaderName,
            address
        );

        return client;
    }

    public async Task<PortalSession> AdministratorAsync()
    {
        return administrator ??= await LoginAsync(
            AdministratorEmail,
            AdministratorPassword
        );
    }

    public async Task<PortalSession> LoginAsync(
        string email,
        string password,
        string? address = null)
    {
        var client = address is null
            ? CreateClient()
            : CreateClientFrom(address);

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { email, password },
            TestContext.Current.CancellationToken
        );

        response.EnsureSuccessStatusCode();

        return new PortalSession(client, ReadCsrfToken(response));
    }

    public async Task<T> WithDbAsync<T>(
        Func<SsoLauncherDbContext, IServiceProvider, Task<T>> work)
    {
        await using var scope = Services.CreateAsyncScope();

        var dbContext = scope.ServiceProvider
            .GetRequiredService<SsoLauncherDbContext>();

        return await work(dbContext, scope.ServiceProvider);
    }

    private static string ReadCsrfToken(HttpResponseMessage response)
    {
        if (response.Headers.TryGetValues("Set-Cookie", out var cookies))
        {
            foreach (var cookie in cookies)
            {
                var pair = cookie.Split(';', 2)[0];
                var separator = pair.IndexOf('=');

                if (separator > 0 && pair[..separator] == CsrfCookieName)
                {
                    return Uri.UnescapeDataString(pair[(separator + 1)..]);
                }
            }
        }

        throw new InvalidOperationException(
            "Login berhasil tetapi cookie CSRF tidak dikirim."
        );
    }
}
