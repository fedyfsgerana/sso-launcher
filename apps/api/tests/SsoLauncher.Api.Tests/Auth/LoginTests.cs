using System.Net;
using System.Net.Http.Json;
using SsoLauncher.Api.Tests.Infrastructure;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Api.Tests.Auth;

[Collection(PortalCollection.Name)]
public sealed class LoginTests(PortalApiFactory factory)
{
    private const string LoginPath = "/api/auth/login";
    private const string SessionPath = "/api/auth/session";
    private const string SessionCookieName = "sso_launcher_session";
    private const int MaxFailuresPerAddress = 5;

    private readonly TestData data = new(factory);

    [Fact]
    public async Task Valid_credentials_start_a_session()
    {
        var user = await data.CreateUserAsync();
        using var client = factory.CreateClientFrom(TestClientAddressStartupFilter.NextAddress());

        var response = await LoginAsync(client, user.Email, user.Password);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(
            response.Headers.GetValues("Set-Cookie"),
            cookie => cookie.StartsWith($"{SessionCookieName}=", StringComparison.Ordinal)
        );

        var body = await response.Content.ReadFromJsonAsync<LoginBody>(
            TestContext.Current.CancellationToken
        );

        Assert.NotNull(body);
        Assert.Equal(user.Id, body.UserId);
        Assert.Equal(user.Email, body.Email);
        Assert.Equal(HttpStatusCode.OK, (await GetSessionAsync(client)).StatusCode);
    }

    [Fact]
    public async Task Wrong_password_is_rejected_and_recorded()
    {
        var user = await data.CreateUserAsync();
        using var client = factory.CreateClientFrom(TestClientAddressStartupFilter.NextAddress());

        var response = await LoginAsync(client, user.Email, "password-salah");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.True(await data.HasSessionAuditAsync(user.Email, AuditActions.LoginFailed));
        Assert.Equal(HttpStatusCode.Unauthorized, (await GetSessionAsync(client)).StatusCode);
    }

    [Fact]
    public async Task Unknown_email_is_rejected()
    {
        using var client = factory.CreateClientFrom(TestClientAddressStartupFilter.NextAddress());

        var response = await LoginAsync(client, "tidak_terdaftar", "password-apa-saja");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Inactive_user_is_rejected_even_with_correct_password()
    {
        var user = await data.CreateUserAsync(isActive: false);
        using var client = factory.CreateClientFrom(TestClientAddressStartupFilter.NextAddress());

        var response = await LoginAsync(client, user.Email, user.Password);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Repeated_failures_from_one_address_lock_the_login()
    {
        var user = await data.CreateUserAsync();
        using var client = factory.CreateClientFrom(TestClientAddressStartupFilter.NextAddress());

        for (var attempt = 0; attempt < MaxFailuresPerAddress; attempt++)
        {
            var failed = await LoginAsync(client, user.Email, "password-salah");

            Assert.Equal(HttpStatusCode.Unauthorized, failed.StatusCode);
        }

        var locked = await LoginAsync(client, user.Email, user.Password);

        Assert.Equal(HttpStatusCode.TooManyRequests, locked.StatusCode);
        Assert.True(locked.Headers.Contains("Retry-After"));
        Assert.True(await data.HasSessionAuditAsync(user.Email, AuditActions.Lock));

        var body = await locked.Content.ReadFromJsonAsync<LockedBody>(
            TestContext.Current.CancellationToken
        );

        Assert.NotNull(body);
        Assert.Equal("login_locked", body.Error);
        Assert.True(body.RetryAfterSeconds > 0);
    }

    [Fact]
    public async Task Lock_applies_only_to_the_failing_address()
    {
        var user = await data.CreateUserAsync();
        using var attacker = factory.CreateClientFrom(TestClientAddressStartupFilter.NextAddress());
        using var owner = factory.CreateClientFrom(TestClientAddressStartupFilter.NextAddress());

        for (var attempt = 0; attempt < MaxFailuresPerAddress; attempt++)
        {
            await LoginAsync(attacker, user.Email, "password-salah");
        }

        var blocked = await LoginAsync(attacker, user.Email, user.Password);
        var allowed = await LoginAsync(owner, user.Email, user.Password);

        Assert.Equal(HttpStatusCode.TooManyRequests, blocked.StatusCode);
        Assert.Equal(HttpStatusCode.OK, allowed.StatusCode);
    }

    [Fact]
    public async Task Successful_login_clears_previous_failures()
    {
        var user = await data.CreateUserAsync();
        using var client = factory.CreateClientFrom(TestClientAddressStartupFilter.NextAddress());

        for (var round = 0; round < 2; round++)
        {
            for (var attempt = 0; attempt < MaxFailuresPerAddress - 1; attempt++)
            {
                await LoginAsync(client, user.Email, "password-salah");
            }

            var response = await LoginAsync(client, user.Email, user.Password);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
    }

    [Fact]
    public async Task Too_many_requests_from_one_address_are_rate_limited()
    {
        using var client = factory.CreateClientFrom(TestClientAddressStartupFilter.NextAddress());
        var responses = new List<HttpResponseMessage>();

        for (var attempt = 0; attempt < 11; attempt++)
        {
            responses.Add(await LoginAsync(
                client,
                $"tidak_terdaftar_{attempt}",
                "password-apa-saja"
            ));
        }

        Assert.All(
            responses.Take(10),
            response => Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode)
        );

        var limited = responses[^1];
        var content = await limited.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        Assert.DoesNotContain("login_locked", content);
    }

    [Fact]
    public async Task Idle_session_expires()
    {
        var user = await data.CreateUserAsync();
        var session = await factory.LoginAsync(
            user.Email,
            user.Password,
            TestClientAddressStartupFilter.NextAddress()
        );

        Assert.Equal(HttpStatusCode.OK, (await GetSessionAsync(session.Client)).StatusCode);

        await data.AgeSessionsAsync(user.Id, TimeSpan.FromMinutes(16));

        Assert.Equal(HttpStatusCode.Unauthorized, (await GetSessionAsync(session.Client)).StatusCode);
        Assert.True(await data.HasSessionAuditAsync(user.Email, AuditActions.Logout));
    }

    private static Task<HttpResponseMessage> LoginAsync(
        HttpClient client,
        string email,
        string password)
    {
        return client.PostAsJsonAsync(
            LoginPath,
            new { email, password },
            TestContext.Current.CancellationToken
        );
    }

    private static Task<HttpResponseMessage> GetSessionAsync(HttpClient client)
    {
        return client.GetAsync(SessionPath, TestContext.Current.CancellationToken);
    }

    private sealed record LoginBody(
        long UserId,
        string Email
    );

    private sealed record LockedBody(
        string Error,
        int RetryAfterSeconds
    );
}
