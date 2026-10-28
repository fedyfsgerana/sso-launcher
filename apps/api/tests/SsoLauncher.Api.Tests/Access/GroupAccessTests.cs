using System.Net;
using System.Net.Http.Json;
using SsoLauncher.Api.Tests.Infrastructure;

namespace SsoLauncher.Api.Tests.Access;

[Collection(PortalCollection.Name)]
public sealed class GroupAccessTests(PortalApiFactory factory)
{
    private const string MyApplicationsPath = "/api/applications/me";
    private const string LaunchPath = "/api/sso/launch";

    private readonly TestData data = new(factory);
    private readonly ServiceClient service = new(factory);

    [Fact]
    public async Task Granting_access_lets_members_see_and_open_the_application()
    {
        var application = await data.CreateApplicationAsync(grantToAdministrator: false);
        await data.AddCredentialAsync(application.Id);
        var groupId = await data.CreateGroupAsync();
        var user = await data.CreateUserAsync();
        var administrator = await factory.AdministratorAsync();

        Assert.Equal(HttpStatusCode.NoContent, (await SetMembersAsync(administrator, groupId, user.Id)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await SetAccessAsync(administrator, groupId, application.Id)).StatusCode);

        var member = await LoginAsync(user);

        Assert.Contains(await MyApplicationIdsAsync(member), id => id == application.Id);
        Assert.Equal(
            HttpStatusCode.OK,
            (await member.PostAsync(LaunchPath, new { applicationId = application.Id })).StatusCode
        );
        Assert.True(await data.HasAuditAsync(groupId, "success", "Akses aplikasi grup diperbarui"));
    }

    [Fact]
    public async Task Revoking_access_hides_the_application_and_ends_application_sessions()
    {
        var application = await data.CreateApplicationAsync(grantToAdministrator: false);
        var credential = await data.AddCredentialAsync(application.Id);
        var groupId = await data.CreateGroupAsync();
        var user = await data.CreateUserAsync();
        var administrator = await factory.AdministratorAsync();
        await SetMembersAsync(administrator, groupId, user.Id);
        await SetAccessAsync(administrator, groupId, application.Id);
        var member = await LoginAsync(user);
        var accessToken = await service.AccessTokenAsync(credential);

        var revoke = await SetAccessAsync(administrator, groupId);

        Assert.Equal(HttpStatusCode.NoContent, revoke.StatusCode);
        Assert.DoesNotContain(await MyApplicationIdsAsync(member), id => id == application.Id);
        Assert.Equal(
            HttpStatusCode.NotFound,
            (await member.PostAsync(LaunchPath, new { applicationId = application.Id })).StatusCode
        );

        var status = await service.CheckSessionAsync(accessToken, user.Id);
        var body = await status.Content.ReadFromJsonAsync<SessionBody>(
            TestContext.Current.CancellationToken
        );

        Assert.NotNull(body);
        Assert.False(body.Active);
        Assert.Equal("access", body.Reason);
    }

    [Fact]
    public async Task Removing_a_member_removes_the_access()
    {
        var application = await data.CreateApplicationAsync(grantToAdministrator: false);
        await data.AddCredentialAsync(application.Id);
        var groupId = await data.CreateGroupAsync();
        var user = await data.CreateUserAsync();
        var administrator = await factory.AdministratorAsync();
        await SetMembersAsync(administrator, groupId, user.Id);
        await SetAccessAsync(administrator, groupId, application.Id);
        var member = await LoginAsync(user);

        var remove = await SetMembersAsync(administrator, groupId);

        Assert.Equal(HttpStatusCode.NoContent, remove.StatusCode);
        Assert.False(await data.IsMemberAsync(groupId, user.Id));
        Assert.Equal(
            HttpStatusCode.NotFound,
            (await member.PostAsync(LaunchPath, new { applicationId = application.Id })).StatusCode
        );
    }

    [Fact]
    public async Task Member_from_another_department_cannot_be_added()
    {
        var groupId = await data.CreateGroupAsync("ITE");
        var user = await data.CreateUserAsync(departemenCode: "HRD");
        var administrator = await factory.AdministratorAsync();

        var response = await SetMembersAsync(administrator, groupId, user.Id);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.False(await data.IsMemberAsync(groupId, user.Id));
    }

    [Fact]
    public async Task Member_from_the_same_department_can_be_added()
    {
        var groupId = await data.CreateGroupAsync("ITE");
        var user = await data.CreateUserAsync(departemenCode: "ITE");
        var administrator = await factory.AdministratorAsync();

        var response = await SetMembersAsync(administrator, groupId, user.Id);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.True(await data.IsMemberAsync(groupId, user.Id));
    }

    [Fact]
    public async Task Unknown_application_is_rejected()
    {
        var groupId = await data.CreateGroupAsync();
        var administrator = await factory.AdministratorAsync();

        var response = await SetAccessAsync(administrator, groupId, long.MaxValue);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task User_without_permission_cannot_change_access()
    {
        var application = await data.CreateApplicationAsync(grantToAdministrator: false);
        var groupId = await data.CreateGroupAsync();
        var user = await data.CreateUserAsync();
        var outsider = await LoginAsync(user);

        var response = await SetAccessAsync(outsider, groupId, application.Id);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Change_without_csrf_token_is_forbidden()
    {
        var application = await data.CreateApplicationAsync(grantToAdministrator: false);
        var groupId = await data.CreateGroupAsync();
        var administrator = await factory.AdministratorAsync();

        var response = await administrator.PutWithoutCsrfAsync(
            AccessPath(groupId),
            new { accesses = new[] { new { applicationId = application.Id } } }
        );

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private static string AccessPath(long groupId)
    {
        return $"/api/admin/groups/{groupId}/access";
    }

    private static Task<HttpResponseMessage> SetAccessAsync(
        PortalSession session,
        long groupId,
        params long[] applicationIds)
    {
        return session.PutAsync(
            AccessPath(groupId),
            new
            {
                accesses = applicationIds
                    .Select(applicationId => new { applicationId })
                    .ToArray()
            }
        );
    }

    private static Task<HttpResponseMessage> SetMembersAsync(
        PortalSession session,
        long groupId,
        params long[] userIds)
    {
        return session.PutAsync(
            $"/api/admin/groups/{groupId}/members",
            new { userIds }
        );
    }

    private Task<PortalSession> LoginAsync(TestUser user)
    {
        return factory.LoginAsync(
            user.Email,
            user.Password,
            TestClientAddressStartupFilter.NextAddress()
        );
    }

    private static async Task<IReadOnlyList<long>> MyApplicationIdsAsync(PortalSession session)
    {
        var applications = await session.Client.GetFromJsonAsync<List<MyApplicationBody>>(
            MyApplicationsPath,
            TestContext.Current.CancellationToken
        );

        return applications?.Select(x => x.Id).ToList() ?? [];
    }

    private sealed record MyApplicationBody(
        long Id
    );

    private sealed record SessionBody(
        bool Active,
        string Reason
    );
}
