using System.Net;
using System.Net.Http.Json;
using SsoLauncher.Api.Tests.Infrastructure;
using SsoLauncher.Application.Applications.Shared;

namespace SsoLauncher.Api.Tests.Applications;

public sealed class ApplicationUrlRulesTests
{
    [Fact]
    public void Sso_application_gets_the_standard_callback()
    {
        var urls = ApplicationUrls.Resolve("https://erp.example.test/", null, null, true);

        Assert.Equal("https://erp.example.test", urls!.AppUrl);
        Assert.Equal("https://erp.example.test/sso/callback", urls.LaunchUrl);
    }

    [Fact]
    public void Application_without_sso_opens_its_own_address()
    {
        var urls = ApplicationUrls.Resolve("https://wiki.example.test", null, null, false);

        Assert.Equal("https://wiki.example.test", urls!.LaunchUrl);
    }

    [Fact]
    public void Custom_callback_path_is_kept()
    {
        var urls = ApplicationUrls.Resolve(
            "http://localhost:3200",
            null,
            "/backend/api/v1/auth/sso/portal",
            true
        );

        Assert.Equal("http://localhost:3200/backend/api/v1/auth/sso/portal", urls!.LaunchUrl);
        Assert.Equal(
            "/backend/api/v1/auth/sso/portal",
            ApplicationUrls.CallbackPathOf(urls.AppUrl, urls.LaunchUrl, true)
        );
    }

    [Theory]
    [InlineData("//evil.example")]
    [InlineData("sso/callback")]
    [InlineData("/sso/callback?x=1")]
    public void Unsafe_callback_path_is_rejected(string path)
    {
        Assert.Null(ApplicationUrls.Resolve("https://erp.example.test", null, path, true));
    }

    [Theory]
    [InlineData("http://erp.example.test")]
    [InlineData("https://erp.example.test/?x=1")]
    [InlineData("ftp://erp.example.test")]
    public void Unsafe_application_address_is_rejected(string address)
    {
        Assert.Null(ApplicationUrls.Resolve(address, null, null, true));
    }

    [Fact]
    public void Old_requests_with_only_a_launch_url_still_work()
    {
        var urls = ApplicationUrls.Resolve(
            null,
            "https://erp.example.test/backend/sso",
            null,
            true
        );

        Assert.Equal("https://erp.example.test", urls!.AppUrl);
        Assert.Equal("https://erp.example.test/backend/sso", urls.LaunchUrl);
    }
}

[Collection(PortalCollection.Name)]
public sealed class ApplicationUrlTests(PortalApiFactory factory)
{
    [Fact]
    public async Task Created_application_stores_both_addresses()
    {
        var administrator = await factory.AdministratorAsync();
        var slug = $"uji-{Guid.NewGuid():N}"[..20];

        var created = await administrator.PostAsync("/api/admin/applications", new
        {
            name = "Aplikasi Uji Alamat",
            slug,
            description = "Uji alamat aplikasi",
            launchUrl = "",
            appUrl = "https://uji-alamat.example.test",
            category = "Lainnya",
            usesSso = true
        });

        var page = await administrator.Client.GetFromJsonAsync<PageBody>(
            $"/api/admin/applications/page?search={slug}",
            TestContext.Current.CancellationToken
        );

        var application = Assert.Single(page!.Items);

        Assert.Equal(HttpStatusCode.OK, created.StatusCode);
        Assert.Equal("https://uji-alamat.example.test", application.AppUrl);
        Assert.Equal("https://uji-alamat.example.test/sso/callback", application.LaunchUrl);
        Assert.Equal("/sso/callback", application.CallbackPath);
    }

    private sealed record ApplicationBody(string AppUrl, string LaunchUrl, string? CallbackPath);

    private sealed record PageBody(List<ApplicationBody> Items);
}
