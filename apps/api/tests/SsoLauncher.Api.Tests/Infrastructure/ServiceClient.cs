using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace SsoLauncher.Api.Tests.Infrastructure;

public sealed class ServiceClient(PortalApiFactory factory)
{
    public async Task<HttpResponseMessage> RequestTokenAsync(
        string clientId,
        string clientSecret)
    {
        using var client = factory.CreateClient();

        return await client.PostAsJsonAsync(
            "/api/service-auth/token",
            new { clientId, clientSecret },
            TestContext.Current.CancellationToken
        );
    }

    public async Task<string> AccessTokenAsync(TestCredential credential)
    {
        var response = await RequestTokenAsync(
            credential.ClientId,
            credential.ClientSecret
        );

        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<TokenBody>(
            TestContext.Current.CancellationToken
        );

        return body?.AccessToken
            ?? throw new InvalidOperationException("Token layanan kosong.");
    }

    public Task<HttpResponseMessage> ValidateAsync(
        string accessToken,
        string ssoToken)
    {
        return SendAsync(
            accessToken,
            "/api/sso/validate",
            new { token = ssoToken }
        );
    }

    public Task<HttpResponseMessage> CheckSessionAsync(
        string accessToken,
        long userId,
        bool keepAlive = true)
    {
        return SendAsync(
            accessToken,
            "/api/sso/session",
            new { userId, keepAlive }
        );
    }

    private async Task<HttpResponseMessage> SendAsync(
        string accessToken,
        string path,
        object body)
    {
        using var client = factory.CreateClient();

        using var request = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = JsonContent.Create(body)
        };

        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken);

        return await client.SendAsync(
            request,
            TestContext.Current.CancellationToken
        );
    }

    private sealed record TokenBody(
        string AccessToken
    );
}
