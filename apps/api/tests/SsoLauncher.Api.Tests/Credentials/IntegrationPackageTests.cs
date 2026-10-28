using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using SsoLauncher.Api.Tests.Infrastructure;

namespace SsoLauncher.Api.Tests.Credentials;

[Collection(PortalCollection.Name)]
public sealed class IntegrationPackageTests(PortalApiFactory factory)
{
    private readonly TestData data = new(factory);

    [Fact]
    public async Task Guide_can_be_downloaded_once_per_credential()
    {
        var application = await data.CreateApplicationAsync();
        var credential = await data.AddCredentialAsync(application.Id);
        var administrator = await factory.AdministratorAsync();
        var path = $"/api/admin/service-credentials/{credential.Id}/integration-guide";

        var first = await administrator.PostAsync(path, new { });
        var template = await first.Content.ReadFromJsonAsync<TemplateBody>(
            TestContext.Current.CancellationToken
        );
        var second = await administrator.PostAsync(path, new { });

        var downloadedAt = await factory.WithDbAsync((dbContext, _) =>
            dbContext.ApplicationServiceCredentials
                .Where(x => x.Id == credential.Id)
                .Select(x => x.GuideDownloadedAt)
                .SingleAsync(TestContext.Current.CancellationToken)
        );

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.StartsWith("SSO Launcher - SSO Integration ", template!.FileName);
        Assert.Contains("PORTAL_CLIENT_SECRET={{PORTAL_CLIENT_SECRET}}", template.Content);
        Assert.Contains("Panduan Integrasi SSO", template.Content);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        Assert.NotNull(downloadedAt);
    }

    [Fact]
    public async Task Guide_of_a_used_credential_cannot_be_downloaded()
    {
        var application = await data.CreateApplicationAsync();
        var credential = await data.AddCredentialAsync(application.Id);
        var administrator = await factory.AdministratorAsync();

        await factory.WithDbAsync(async (dbContext, _) =>
        {
            var row = await dbContext.ApplicationServiceCredentials.SingleAsync(
                x => x.Id == credential.Id,
                TestContext.Current.CancellationToken
            );

            row.LastUsedAt = DateTimeOffset.UtcNow;

            return await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        });

        var response = await administrator.PostAsync(
            $"/api/admin/service-credentials/{credential.Id}/integration-guide",
            new { }
        );

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task User_without_permission_cannot_download_the_guide()
    {
        var application = await data.CreateApplicationAsync();
        var credential = await data.AddCredentialAsync(application.Id);
        var other = await data.CreateUserAsync();
        var session = await factory.LoginAsync(other.Email, other.Password, "10.61.1.1");

        var response = await session.PostAsync(
            $"/api/admin/service-credentials/{credential.Id}/integration-guide",
            new { }
        );

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Unconfirmed_credential_can_be_discarded()
    {
        var application = await data.CreateApplicationAsync();
        var credential = await data.AddCredentialAsync(application.Id);
        var administrator = await factory.AdministratorAsync();

        var response = await administrator.PostAsync(
            $"/api/admin/service-credentials/{credential.Id}/discard",
            new { }
        );

        var exists = await factory.WithDbAsync((dbContext, _) =>
            dbContext.ApplicationServiceCredentials.AnyAsync(
                x => x.Id == credential.Id,
                TestContext.Current.CancellationToken
            )
        );

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.False(exists);
    }

    [Fact]
    public async Task Used_credential_cannot_be_discarded()
    {
        var application = await data.CreateApplicationAsync();
        var credential = await data.AddCredentialAsync(application.Id);
        var administrator = await factory.AdministratorAsync();

        await factory.WithDbAsync(async (dbContext, _) =>
        {
            var row = await dbContext.ApplicationServiceCredentials.SingleAsync(
                x => x.Id == credential.Id,
                TestContext.Current.CancellationToken
            );

            row.LastUsedAt = DateTimeOffset.UtcNow;

            return await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        });

        var response = await administrator.PostAsync(
            $"/api/admin/service-credentials/{credential.Id}/discard",
            new { }
        );

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Theory]
    [InlineData("ERP Utama", "SSO Launcher - SSO Integration ERP Utama.md")]
    [InlineData("Gudang / Logistik", "SSO Launcher - SSO Integration Gudang Logistik.md")]
    [InlineData("  ", "SSO Launcher - SSO Integration.md")]
    public void File_name_contains_a_safe_application_name(string name, string expected)
    {
        Assert.Equal(
            expected,
            SsoLauncher.Application.ServiceCredentials.IntegrationPackage.IntegrationPackageService.FileNameFor(name)
        );
    }

    private sealed record TemplateBody(string FileName, string Content);
}
