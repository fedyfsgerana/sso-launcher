using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;

namespace SsoLauncher.Application.PortalMenus.GetPortalMenus;

public sealed class GetPortalMenusService(
    ISsoLauncherDbContext dbContext)
{
    public async Task<IReadOnlyList<PortalMenuResponse>> GetAsync(
        CancellationToken cancellationToken = default)
    {
        var menus = await dbContext.PortalMenus
            .AsNoTracking()
            .OrderBy(x => x.ParentId)
            .ThenBy(x => x.SortOrder)
            .Select(x => new
            {
                x.Id,
                x.ParentId,
                x.Label,
                x.Icon,
                x.TargetType,
                x.TargetValue,
                x.SortOrder,
                x.IsSystem,
                x.IsActive,
                x.MaintenanceActive,
                x.MaintenanceTitle,
                x.MaintenanceMessage,
                x.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        var grants = await dbContext.UserGroupMenuAccesses
            .AsNoTracking()
            .Select(x => new
            {
                x.PortalMenuId,
                x.UserGroupId,
                GroupName = x.UserGroup.Name
            })
            .ToListAsync(cancellationToken);

        var lookup = grants
            .GroupBy(x => x.PortalMenuId)
            .ToDictionary(
                group => group.Key,
                group => group
                    .OrderBy(x => x.GroupName)
                    .ToList()
            );

        return menus
            .Select(x => new PortalMenuResponse(
                x.Id,
                x.ParentId,
                x.Label,
                x.Icon,
                x.TargetType,
                x.TargetValue,
                x.SortOrder,
                x.IsSystem,
                x.IsActive,
                x.MaintenanceActive,
                x.MaintenanceTitle,
                x.MaintenanceMessage,
                lookup.TryGetValue(x.Id, out var groups)
                    ? groups.Select(group => group.UserGroupId).ToList()
                    : [],
                lookup.TryGetValue(x.Id, out var named)
                    ? named.Select(group => group.GroupName).ToList()
                    : [],
                x.UpdatedAt
            ))
            .ToList();
    }
}
