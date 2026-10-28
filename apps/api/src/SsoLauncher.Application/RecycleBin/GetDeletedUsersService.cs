using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;

namespace SsoLauncher.Application.RecycleBin;

public sealed class GetDeletedUsersService(
    ISsoLauncherDbContext dbContext)
{
    public async Task<IReadOnlyList<DeletedItemResponse>> GetAsync(
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(x => x.DeletedAt != null)
            .OrderByDescending(x => x.DeletedAt)
            .Select(x => new DeletedItemResponse(
                x.Id,
                x.Name,
                x.Email,
                x.DeletedAt!.Value,
                x.DeletedByName,
                x.DeleteReason
            ))
            .ToListAsync(cancellationToken);
    }
}