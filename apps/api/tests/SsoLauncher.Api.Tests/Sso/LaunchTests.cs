using System.Net;
using System.Net.Http.Json;
using SsoLauncher.Api.Tests.Infrastructure;

namespace SsoLauncher.Api.Tests.Sso;

[Collection(PortalCollection.Name)]
public sealed class LaunchTests(PortalApiFactory factory)
{
    private const string LaunchPath = "/api/sso/launch";

    private readonly TestData data = new(factory);

    [Fact]
    public async Task Sso_application_with_credential_returns_token_url()
    {
        var application = await data.CreateApplicationAsync();
        await data.AddCredentialAsync(application.Id);
        var administrator = await factory.AdministratorAsync();

        var response = await administrator.PostAsync(
            LaunchPath,
            new { applicationId = application.Id }
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await ReadAsync<LaunchBody>(response);

        Assert.True(body.UsesSso);
        Assert.StartsWith($"{application.LaunchUrl}?sso_token=", body.LaunchUrl);
        Assert.NotNull(body.ExpiresAt);
    }

    [Fact]
    public async Task Sso_application_without_credential_is_rejected_as_not_ready()
    {
        var application = await data.CreateApplicationAsync();
        var administrator = await factory.AdministratorAsync();

        var response = await administrator.PostAsync(
            LaunchPath,
            new { applicationId = application.Id }
        );

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("sso_not_ready", (await ReadAsync<ErrorBody>(response)).Code);
        Assert.True(await data.HasAuditAsync(
            application.Id,
            "failed",
            "Kredensial SSO belum tersedia"
        ));
    }

    [Fact]
    public async Task Sso_application_with_revoked_credential_is_rejected_as_not_ready()
    {
        var application = await data.CreateApplicationAsync();
        var credential = await data.AddCredentialAsync(application.Id);
        await data.RevokeCredentialAsync(credential.Id);
        var administrator = await factory.AdministratorAsync();

        var response = await administrator.PostAsync(
            LaunchPath,
            new { applicationId = application.Id }
        );

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Sso_application_with_credential_without_validate_scope_is_rejected_as_not_ready()
    {
        var application = await data.CreateApplicationAsync();
        await data.AddCredentialAsync(application.Id, "users.read");
        var administrator = await factory.AdministratorAsync();

        var response = await administrator.PostAsync(
            LaunchPath,
            new { applicationId = application.Id }
        );

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Application_without_sso_opens_plain_url_without_token()
    {
        var application = await data.CreateApplicationAsync(usesSso: false);
        var administrator = await factory.AdministratorAsync();

        var response = await administrator.PostAsync(
            LaunchPath,
            new { applicationId = application.Id }
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await ReadAsync<LaunchBody>(response);

        Assert.False(body.UsesSso);
        Assert.Equal(application.LaunchUrl, body.LaunchUrl);
        Assert.Null(body.ExpiresAt);
    }

    [Fact]
    public async Task Application_without_group_access_is_not_found()
    {
        var application = await data.CreateApplicationAsync(grantToAdministrator: false);
        await data.AddCredentialAsync(application.Id);
        var administrator = await factory.AdministratorAsync();

        var response = await administrator.PostAsync(
            LaunchPath,
            new { applicationId = application.Id }
        );

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Launch_without_csrf_token_is_forbidden()
    {
        var application = await data.CreateApplicationAsync();
        await data.AddCredentialAsync(application.Id);
        var administrator = await factory.AdministratorAsync();

        var response = await administrator.PostWithoutCsrfAsync(
            LaunchPath,
            new { applicationId = application.Id }
        );

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Launch_without_portal_session_is_unauthorized()
    {
        var application = await data.CreateApplicationAsync();
        using var anonymous = factory.CreateClient();

        var response = await anonymous.PostAsJsonAsync(
            LaunchPath,
            new { applicationId = application.Id },
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private static async Task<T> ReadAsync<T>(HttpResponseMessage response)
    {
        var body = await response.Content.ReadFromJsonAsync<T>(
            TestContext.Current.CancellationToken
        );

        Assert.NotNull(body);

        return body;
    }

    private sealed record LaunchBody(
        string LaunchUrl,
        DateTimeOffset? ExpiresAt,
        bool UsesSso
    );

    private sealed record ErrorBody(
        string Code
    );
}
