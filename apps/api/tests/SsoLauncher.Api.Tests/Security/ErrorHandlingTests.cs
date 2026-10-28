using System.Net;
using System.Text.Json;
using SsoLauncher.Api.Tests.Infrastructure;

namespace SsoLauncher.Api.Tests.Security;

[Collection(PortalCollection.Name)]
public sealed class ErrorHandlingTests(PortalApiFactory factory)
{
    [Fact]
    public async Task Unhandled_error_returns_a_reference_without_internal_details()
    {
        var client = factory.CreateClientFrom("10.20.30.60");

        var response = await client.GetAsync(
            FailingEndpointStartupFilter.Path,
            TestContext.Current.CancellationToken
        );

        var body = await response.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal(
            "application/problem+json",
            response.Content.Headers.ContentType?.MediaType
        );
        Assert.DoesNotContain(FailingEndpointStartupFilter.SecretMessage, body);
        Assert.DoesNotContain("InvalidOperationException", body);

        using var json = JsonDocument.Parse(body);
        var reference = json.RootElement.GetProperty("referenceId").GetString();

        Assert.False(string.IsNullOrWhiteSpace(reference));
        Assert.Equal(
            reference,
            response.Headers.GetValues("X-Reference-Id").Single()
        );
        Assert.Contains(reference!, body);
    }
}
