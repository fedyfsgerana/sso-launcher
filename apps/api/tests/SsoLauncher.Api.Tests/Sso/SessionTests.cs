using System.Net;
using System.Net.Http.Json;
using SsoLauncher.Api.Tests.Infrastructure;

namespace SsoLauncher.Api.Tests.Sso;

[Collection(PortalCollection.Name)]
public sealed class SessionTests(PortalApiFactory factory)
{
    private readonly TestData data = new(factory);
    private readonly ServiceClient service = new(factory);

    [Fact]
    public async Task Active_portal_session_is_reported_as_active()
    {
        var application = await data.CreateApplicationAsync();
        var credential = await data.AddCredentialAsync(application.Id);
        await factory.AdministratorAsync();
        var accessToken = await service.AccessTokenAsync(credential);

        var status = await CheckAsync(accessToken, await data.AdministratorIdAsync());

        Assert.True(status.Active);
        Assert.Equal("active", status.Reason);
        Assert.NotNull(status.SessionExpiresAt);
    }

    [Fact]
    public async Task Portal_logout_ends_the_session_for_applications()
    {
        var application = await data.CreateApplicationAsync(grantToAdministrator: false);
        var credential = await data.AddCredentialAsync(application.Id);
        var member = await data.CreateMemberAsync(application.Id);
        var session = await factory.LoginAsync(member.Email, member.Password);
        var accessToken = await service.AccessTokenAsync(credential);

        var before = await CheckAsync(accessToken, member.Id);
        var logout = await session.PostAsync("/api/auth/logout", new { });
        var after = await CheckAsync(accessToken, member.Id);

        Assert.True(before.Active);
        Assert.True(logout.IsSuccessStatusCode);
        Assert.False(after.Active);
        Assert.Equal("session", after.Reason);
    }

    [Fact]
    public async Task Revoked_group_access_is_reported_as_access()
    {
        var application = await data.CreateApplicationAsync();
        var credential = await data.AddCredentialAsync(application.Id);
        await factory.AdministratorAsync();
        var accessToken = await service.AccessTokenAsync(credential);
        await data.RevokeAdministratorAccessAsync(application.Id);

        var status = await CheckAsync(accessToken, await data.AdministratorIdAsync());

        Assert.False(status.Active);
        Assert.Equal("access", status.Reason);
    }

    [Fact]
    public async Task Deactivated_user_is_reported_as_user()
    {
        var application = await data.CreateApplicationAsync(grantToAdministrator: false);
        var credential = await data.AddCredentialAsync(application.Id);
        var member = await data.CreateMemberAsync(application.Id);
        var accessToken = await service.AccessTokenAsync(credential);
        await data.DeactivateUserAsync(member.Id);

        var status = await CheckAsync(accessToken, member.Id);

        Assert.False(status.Active);
        Assert.Equal("user", status.Reason);
    }

    [Fact]
    public async Task Session_check_without_service_token_is_unauthorized()
    {
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/sso/session",
            new { userId = 1, keepAlive = true },
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private async Task<SessionBody> CheckAsync(string accessToken, long userId)
    {
        var response = await service.CheckSessionAsync(accessToken, userId);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<SessionBody>(
            TestContext.Current.CancellationToken
        );

        Assert.NotNull(body);

        return body;
    }

    private sealed record SessionBody(
        bool Active,
        string Reason,
        DateTimeOffset? SessionExpiresAt
    );
}
