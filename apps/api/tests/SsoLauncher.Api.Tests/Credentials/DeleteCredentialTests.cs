using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using SsoLauncher.Api.Tests.Infrastructure;

namespace SsoLauncher.Api.Tests.Credentials;

[Collection(PortalCollection.Name)]
public sealed class DeleteCredentialTests(PortalApiFactory factory)
{
    private readonly TestData data = new(factory);

    private const string Reason = "?reason=Uji%20hapus%20kredensial";

    [Fact]
    public async Task Active_credential_cannot_be_deleted()
    {
        var application = await data.CreateApplicationAsync();
        var credential = await data.AddCredentialAsync(application.Id);
        var administrator = await factory.AdministratorAsync();

        var response = await administrator.DeleteAsync(
            $"/api/admin/service-credentials/{credential.Id}/record{Reason}"
        );

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Revoked_credential_can_be_deleted_and_disappears_from_the_list()
    {
        var application = await data.CreateApplicationAsync();
        var credential = await data.AddCredentialAsync(application.Id);
        var administrator = await factory.AdministratorAsync();

        var revoked = await administrator.DeleteAsync(
            $"/api/admin/service-credentials/{credential.Id}{Reason}"
        );
        var deleted = await administrator.DeleteAsync(
            $"/api/admin/service-credentials/{credential.Id}/record{Reason}"
        );

        var list = await administrator.Client.GetFromJsonAsync<List<IdBody>>(
            $"/api/admin/service-credentials?applicationId={application.Id}",
            TestContext.Current.CancellationToken
        );

        var audited = await factory.WithDbAsync((dbContext, _) =>
            dbContext.AuditLogs.AnyAsync(
                x => x.TargetId == credential.Id &&
                     x.Action == "delete" &&
                     x.Reason == "Uji hapus kredensial",
                TestContext.Current.CancellationToken
            )
        );

        Assert.Equal(HttpStatusCode.NoContent, revoked.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        Assert.DoesNotContain(list!, x => x.Id == credential.Id);
        Assert.True(audited);
    }

    [Fact]
    public async Task Unknown_credential_is_not_found()
    {
        var administrator = await factory.AdministratorAsync();

        var response = await administrator.DeleteAsync(
            $"/api/admin/service-credentials/999999999/record{Reason}"
        );

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private sealed record IdBody(long Id);
}
