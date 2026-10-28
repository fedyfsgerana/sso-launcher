using System.Net.Http.Json;
using SsoLauncher.Api.Tests.Infrastructure;

namespace SsoLauncher.Api.Tests.Listing;

[Collection(PortalCollection.Name)]
public sealed class DefaultOrderTests(PortalApiFactory factory)
{
    private readonly TestData data = new(factory);

    [Fact]
    public async Task Users_are_listed_newest_first()
    {
        var older = await data.CreateUserAsync();
        var newer = await data.CreateUserAsync();

        var ids = await PageIdsAsync("/api/admin/users/page?pageSize=100");

        Assert.Equal(newer.Id, ids[0]);
        Assert.True(ids.IndexOf(newer.Id) < ids.IndexOf(older.Id));
    }

    [Fact]
    public async Task Groups_are_listed_newest_first()
    {
        var older = await data.CreateGroupAsync();
        var newer = await data.CreateGroupAsync();

        var ids = await PageIdsAsync("/api/admin/groups/page?pageSize=100");

        Assert.Equal(newer, ids[0]);
        Assert.True(ids.IndexOf(newer) < ids.IndexOf(older));
    }

    [Fact]
    public async Task Applications_are_listed_newest_first()
    {
        var older = await data.CreateApplicationAsync();
        var newer = await data.CreateApplicationAsync();

        var ids = await PageIdsAsync("/api/admin/applications/page?pageSize=100");

        Assert.Equal(newer.Id, ids[0]);
        Assert.True(ids.IndexOf(newer.Id) < ids.IndexOf(older.Id));
    }

    [Fact]
    public async Task Choosing_a_sort_column_still_overrides_the_default_order()
    {
        await data.CreateApplicationAsync();
        var newer = await data.CreateApplicationAsync();

        var ascending = await PageIdsAsync(
            "/api/admin/applications/page?pageSize=100&sort=updatedAt&direction=asc"
        );

        Assert.NotEqual(newer.Id, ascending[0]);
        Assert.Equal(newer.Id, ascending[^1]);
    }

    [Fact]
    public async Task Credentials_are_listed_newest_first()
    {
        var application = await data.CreateApplicationAsync();
        var older = await data.AddCredentialAsync(application.Id);
        var newer = await data.AddCredentialAsync(application.Id);
        var administrator = await factory.AdministratorAsync();

        var credentials = await administrator.Client.GetFromJsonAsync<List<IdBody>>(
            $"/api/admin/service-credentials?applicationId={application.Id}",
            TestContext.Current.CancellationToken
        );

        Assert.NotNull(credentials);
        Assert.Equal(new[] { newer.Id, older.Id }, credentials.Select(x => x.Id));
    }

    private async Task<List<long>> PageIdsAsync(string path)
    {
        var administrator = await factory.AdministratorAsync();
        var page = await administrator.Client.GetFromJsonAsync<PageBody>(
            path,
            TestContext.Current.CancellationToken
        );

        Assert.NotNull(page);

        return page.Items.Select(x => x.Id).ToList();
    }

    private sealed record IdBody(
        long Id
    );

    private sealed record PageBody(
        IReadOnlyList<IdBody> Items
    );
}
