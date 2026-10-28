using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Applications.GetApplicationCatalog;

public sealed class GetApplicationCatalogService(
    ISsoLauncherDbContext dbContext)
{
    public async Task<IReadOnlyList<ApplicationCatalogItemResponse>> GetAsync(
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Applications
            .AsNoTracking()
            .Where(x => x.Status != ApplicationStatuses.Inactive)
            .OrderBy(x => x.Name)
            .Select(x => new ApplicationCatalogItemResponse(
                x.Id,
                x.Name,
                x.Slug,
                x.Description,
                x.Category,
                x.Icon,
                x.Color,
                x.Status
            ))
            .ToListAsync(cancellationToken);
    }
}