using System.Net.Http.Json;

namespace SsoLauncher.Api.Tests.Infrastructure;

public sealed class PortalSession(HttpClient client, string csrfToken)
{
    private const string CsrfHeaderName = "X-CSRF-Token";

    public HttpClient Client => client;

    public Task<HttpResponseMessage> PostAsync(string path, object body)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = JsonContent.Create(body)
        };

        request.Headers.Add(CsrfHeaderName, csrfToken);

        return client.SendAsync(request, TestContext.Current.CancellationToken);
    }

    public Task<HttpResponseMessage> PutAsync(string path, object body)
    {
        var request = new HttpRequestMessage(HttpMethod.Put, path)
        {
            Content = JsonContent.Create(body)
        };

        request.Headers.Add(CsrfHeaderName, csrfToken);

        return client.SendAsync(request, TestContext.Current.CancellationToken);
    }

    public Task<HttpResponseMessage> DeleteAsync(string path)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete, path);

        request.Headers.Add(CsrfHeaderName, csrfToken);

        return client.SendAsync(request, TestContext.Current.CancellationToken);
    }

    public Task<HttpResponseMessage> PutWithoutCsrfAsync(string path, object body)
    {
        return client.PutAsJsonAsync(
            path,
            body,
            TestContext.Current.CancellationToken
        );
    }

    public Task<HttpResponseMessage> PostWithoutCsrfAsync(string path, object body)
    {
        return client.PostAsJsonAsync(
            path,
            body,
            TestContext.Current.CancellationToken
        );
    }
}
