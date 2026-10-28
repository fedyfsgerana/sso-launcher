using System.Net;
using System.Text;
using SsoLauncher.Api.Tests.Infrastructure;

namespace SsoLauncher.Api.Tests.Security;

[Collection(PortalCollection.Name)]
public sealed class RequestLimitTests(PortalApiFactory factory)
{
    [Fact]
    public async Task Request_body_over_the_limit_is_rejected()
    {
        var client = factory.CreateClientFrom("10.20.30.50");
        var oversized = new string('a', 2 * 1024 * 1024);
        var body = new StringContent(
            $$"""{"email":"{{oversized}}","password":"x"}""",
            Encoding.UTF8,
            "application/json"
        );

        var response = await client.PostAsync(
            "/api/auth/login",
            body,
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
    }

    [Fact]
    public async Task Request_body_within_the_limit_is_processed()
    {
        var client = factory.CreateClientFrom("10.20.30.51");
        var body = new StringContent(
            """{"email":"tidak-ada","password":"salah"}""",
            Encoding.UTF8,
            "application/json"
        );

        var response = await client.PostAsync(
            "/api/auth/login",
            body,
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
