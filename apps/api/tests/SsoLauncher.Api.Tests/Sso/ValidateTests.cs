using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using SsoLauncher.Api.Tests.Infrastructure;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Api.Tests.Sso;

[Collection(PortalCollection.Name)]
public sealed class ValidateTests(PortalApiFactory factory)
{
    private readonly TestData data = new(factory);
    private readonly ServiceClient service = new(factory);

    [Fact]
    public async Task Valid_token_returns_user_application_and_groups()
    {
        var application = await data.CreateApplicationAsync();
        var credential = await data.AddCredentialAsync(application.Id);
        var administrator = await factory.AdministratorAsync();
        var ssoToken = await data.LaunchTokenAsync(administrator, application.Id);
        var accessToken = await service.AccessTokenAsync(credential);

        var response = await service.ValidateAsync(accessToken, ssoToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ValidateBody>(
            TestContext.Current.CancellationToken
        );

        Assert.NotNull(body);
        Assert.Equal(await data.AdministratorIdAsync(), body.UserId);
        Assert.Equal(PortalApiFactory.AdministratorEmail, body.Email);
        Assert.Equal(application.Id, body.ApplicationId);
        Assert.Equal(application.Slug, body.ApplicationSlug);
        Assert.Contains(PortalApiFactory.AdministratorGroupName, body.Groups);
    }

    [Fact]
    public async Task Token_cannot_be_used_twice()
    {
        var application = await data.CreateApplicationAsync();
        var credential = await data.AddCredentialAsync(application.Id);
        var administrator = await factory.AdministratorAsync();
        var ssoToken = await data.LaunchTokenAsync(administrator, application.Id);
        var accessToken = await service.AccessTokenAsync(credential);

        var first = await service.ValidateAsync(accessToken, ssoToken);
        var second = await service.ValidateAsync(accessToken, ssoToken);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, second.StatusCode);
    }

    [Fact]
    public async Task Concurrent_use_of_the_same_token_lets_only_one_through()
    {
        var application = await data.CreateApplicationAsync();
        var credential = await data.AddCredentialAsync(application.Id);
        var administrator = await factory.AdministratorAsync();
        var ssoToken = await data.LaunchTokenAsync(administrator, application.Id);
        var accessToken = await service.AccessTokenAsync(credential);

        var responses = await Task.WhenAll(
            service.ValidateAsync(accessToken, ssoToken),
            service.ValidateAsync(accessToken, ssoToken),
            service.ValidateAsync(accessToken, ssoToken)
        );

        Assert.Single(responses, x => x.StatusCode == HttpStatusCode.OK);
        Assert.Equal(
            2,
            responses.Count(x => x.StatusCode == HttpStatusCode.Unauthorized)
        );
    }

    [Fact]
    public async Task Used_token_is_recorded_in_the_database()
    {
        var application = await data.CreateApplicationAsync();
        var credential = await data.AddCredentialAsync(application.Id);
        var administrator = await factory.AdministratorAsync();
        var ssoToken = await data.LaunchTokenAsync(administrator, application.Id);
        var accessToken = await service.AccessTokenAsync(credential);
        var before = await CountTokenUsesAsync();

        var response = await service.ValidateAsync(accessToken, ssoToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(before + 1, await CountTokenUsesAsync());
    }

    [Fact]
    public async Task Token_issued_for_another_application_is_rejected()
    {
        var target = await data.CreateApplicationAsync();
        await data.AddCredentialAsync(target.Id);
        var other = await data.CreateApplicationAsync();
        var otherCredential = await data.AddCredentialAsync(other.Id);
        var administrator = await factory.AdministratorAsync();
        var ssoToken = await data.LaunchTokenAsync(administrator, target.Id);
        var accessToken = await service.AccessTokenAsync(otherCredential);

        var response = await service.ValidateAsync(accessToken, ssoToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Revoked_credential_cannot_validate_tokens()
    {
        var application = await data.CreateApplicationAsync();
        var credential = await data.AddCredentialAsync(application.Id);
        var administrator = await factory.AdministratorAsync();
        var ssoToken = await data.LaunchTokenAsync(administrator, application.Id);
        var accessToken = await service.AccessTokenAsync(credential);
        await data.RevokeCredentialAsync(credential.Id);

        var response = await service.ValidateAsync(accessToken, ssoToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Invalid_token_is_rejected()
    {
        var application = await data.CreateApplicationAsync();
        var credential = await data.AddCredentialAsync(application.Id);
        var accessToken = await service.AccessTokenAsync(credential);

        var response = await service.ValidateAsync(accessToken, "bukan-token-yang-sah");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Service_token_with_wrong_secret_is_rejected()
    {
        var application = await data.CreateApplicationAsync();
        var credential = await data.AddCredentialAsync(application.Id);

        var response = await service.RequestTokenAsync(
            credential.ClientId,
            "secret-yang-salah"
        );

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private Task<int> CountTokenUsesAsync()
    {
        return factory.WithDbAsync((dbContext, _) =>
            dbContext.Set<SsoTokenUse>()
                .CountAsync(TestContext.Current.CancellationToken)
        );
    }

    private sealed record ValidateBody(
        long UserId,
        string Email,
        long ApplicationId,
        string ApplicationSlug,
        IReadOnlyList<string> Groups
    );
}
