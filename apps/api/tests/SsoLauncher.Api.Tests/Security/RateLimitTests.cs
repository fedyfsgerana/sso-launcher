using System.Net;
using SsoLauncher.Api.Tests.Infrastructure;

namespace SsoLauncher.Api.Tests.Security;

[Collection(PortalCollection.Name)]
public sealed class RateLimitTests(PortalApiFactory factory)
{
    private const string ExportPath = "/api/admin/audit-logs/export";

    [Fact]
    public async Task Audit_export_is_limited_per_session()
    {
        var session = await factory.LoginAsync(
            PortalApiFactory.AdministratorEmail,
            PortalApiFactory.AdministratorPassword,
            "10.20.30.40"
        );

        for (var attempt = 0; attempt < 3; attempt++)
        {
            var allowed = await session.Client.GetAsync(
                ExportPath,
                TestContext.Current.CancellationToken
            );

            Assert.Equal(HttpStatusCode.OK, allowed.StatusCode);
        }

        var rejected = await session.Client.GetAsync(
            ExportPath,
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.TooManyRequests, rejected.StatusCode);
        Assert.True(rejected.Headers.Contains("Retry-After"));
    }
}
