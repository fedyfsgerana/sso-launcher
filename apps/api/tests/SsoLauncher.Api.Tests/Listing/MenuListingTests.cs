using System.Net.Http.Json;
using SsoLauncher.Api.Tests.Infrastructure;

namespace SsoLauncher.Api.Tests.Listing;

[Collection(PortalCollection.Name)]
public sealed class MenuListingTests(PortalApiFactory factory)
{
    [Fact]
    public async Task Admin_menus_include_last_updated_time()
    {
        var administrator = await factory.AdministratorAsync();

        var menus = await administrator.Client.GetFromJsonAsync<List<MenuBody>>(
            "/api/admin/menus",
            TestContext.Current.CancellationToken
        );

        Assert.NotNull(menus);
        Assert.NotEmpty(menus);
        Assert.All(menus, menu => Assert.NotEqual(default, menu.UpdatedAt));
    }

    private sealed record MenuBody(
        long Id,
        DateTimeOffset UpdatedAt
    );
}
