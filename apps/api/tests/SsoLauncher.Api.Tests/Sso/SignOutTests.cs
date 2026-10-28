using System.Net;
using System.Net.Http.Json;
using SsoLauncher.Api.Tests.Infrastructure;

namespace SsoLauncher.Api.Tests.Sso;

[Collection(PortalCollection.Name)]
public sealed class SignOutTests(PortalApiFactory factory)
{
    private const string SignOutPath = "/api/sso/sign-out";

    private readonly TestData data = new(factory);

    [Fact]
    public async Task Sign_out_is_recorded_and_keeps_the_portal_session()
    {
        var application = await data.CreateApplicationAsync();
        var administrator = await factory.AdministratorAsync();

        var response = await administrator.PostAsync(
            SignOutPath,
            new { slug = application.Slug }
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<SignOutBody>(
            TestContext.Current.CancellationToken
        );

        Assert.NotNull(body);
        Assert.Equal(application.Id, body.ApplicationId);
        Assert.Equal(application.Name, body.Name);
        Assert.True(await data.HasAuditAsync(
            application.Id,
            "success",
            "Keluar dari aplikasi"
        ));

        var session = await administrator.Client.GetAsync(
            "/api/auth/session",
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, session.StatusCode);
    }

    [Fact]
    public async Task Sign_out_from_application_without_access_is_not_found()
    {
        var application = await data.CreateApplicationAsync(grantToAdministrator: false);
        var administrator = await factory.AdministratorAsync();

        var response = await administrator.PostAsync(
            SignOutPath,
            new { slug = application.Slug }
        );

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.False(await data.HasAuditAsync(
            application.Id,
            "success",
            "Keluar dari aplikasi"
        ));
    }

    [Fact]
    public async Task Sign_out_without_portal_session_is_unauthorized()
    {
        var application = await data.CreateApplicationAsync();
        using var anonymous = factory.CreateClient();

        var response = await anonymous.PostAsJsonAsync(
            SignOutPath,
            new { slug = application.Slug },
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Sign_out_without_csrf_token_is_forbidden()
    {
        var application = await data.CreateApplicationAsync();
        var administrator = await factory.AdministratorAsync();

        var response = await administrator.PostWithoutCsrfAsync(
            SignOutPath,
            new { slug = application.Slug }
        );

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private sealed record SignOutBody(
        long ApplicationId,
        string Name,
        string Slug
    );
}
