using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;

namespace SsoLauncher.Application.RecycleBin;

public sealed class GetDeletedApplicationsService(
    ISsoLauncherDbContext dbContext)
{
    public async Task<IReadOnlyList<DeletedItemResponse>> GetAsync(
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Applications
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(x => x.DeletedAt != null)
            .OrderByDescending(x => x.DeletedAt)
            .Select(x => new DeletedItemResponse(
                x.Id,
                x.Name,
                x.Slug,
                x.DeletedAt!.Value,
                x.DeletedByName,
                x.DeleteReason,
                x.Icon,
                x.Color
            ))
            .ToListAsync(cancellationToken);
    }
}
