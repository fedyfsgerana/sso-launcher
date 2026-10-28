using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using SsoLauncher.Api.Tests.Infrastructure;

namespace SsoLauncher.Api.Tests.RecycleBin;

[Collection(PortalCollection.Name)]
public sealed class DeletedApplicationTests(PortalApiFactory factory)
{
    private readonly TestData data = new(factory);

    [Fact]
    public async Task Deleted_applications_keep_their_icon_and_color()
    {
        var application = await data.CreateApplicationAsync(grantToAdministrator: false);

        await factory.WithDbAsync(async (dbContext, _) =>
        {
            var row = await dbContext.Applications.SingleAsync(
                x => x.Id == application.Id,
                TestContext.Current.CancellationToken
            );

            row.Icon = "truck";
            row.Color = "app-pr";
            row.DeletedAt = DateTimeOffset.UtcNow;
            row.DeleteReason = "Uji Tempat Sampah";

            return await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        });

        var administrator = await factory.AdministratorAsync();
        var items = await administrator.Client.GetFromJsonAsync<List<DeletedBody>>(
            "/api/admin/recycle-bin/application",
            TestContext.Current.CancellationToken
        );

        var item = Assert.Single(items!, x => x.Id == application.Id);

        Assert.Equal("truck", item.Icon);
        Assert.Equal("app-pr", item.Color);
    }

    private sealed record DeletedBody(
        long Id,
        string Name,
        string? Icon,
        string? Color
    );
}
