using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.PortalMenus.GetMyMenus;

public sealed class GetMyMenusService(
    ISsoLauncherDbContext dbContext)
{
    public async Task<IReadOnlyList<MyMenuResponse>> GetAsync(
        long userId,
        CancellationToken cancellationToken = default)
    {
        var granted = await dbContext.UserGroupMenuAccesses
            .AsNoTracking()
            .Where(x =>
                x.UserGroup.IsActive &&
                x.UserGroup.Members.Any(member => member.UserId == userId))
            .Select(x => x.PortalMenuId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (granted.Count == 0)
        {
            return [];
        }

        var actions = await dbContext.UserGroupMenuActions
            .AsNoTracking()
            .Where(x =>
                x.UserGroup.IsActive &&
                x.UserGroup.Members.Any(member => member.UserId == userId))
            .Select(x => new { x.PortalMenuId, x.ActionKey })
            .Distinct()
            .ToListAsync(cancellationToken);

        var actionsByMenu = actions
            .GroupBy(x => x.PortalMenuId)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyList<string>)group
                    .Select(x => x.ActionKey)
                    .Distinct()
                    .Order()
                    .ToList()
            );

        var tree = await dbContext.PortalMenus
            .AsNoTracking()
            .Select(x => new { x.Id, x.ParentId, x.TargetType })
            .ToListAsync(cancellationToken);
        var nodeById = tree.ToDictionary(x => x.Id);
        var visibleIds = granted.ToHashSet();

        foreach (var menuId in granted)
        {
            var parentId = nodeById.TryGetValue(menuId, out var node)
                ? node.ParentId
                : null;

            while (parentId is { } currentId &&
                   nodeById.TryGetValue(currentId, out var parent))
            {
                if (parent.TargetType == PortalMenuTargetTypes.Section)
                {
                    visibleIds.Add(parent.Id);
                    break;
                }

                parentId = parent.ParentId;
            }
        }

        var loaded = await dbContext.PortalMenus
            .AsNoTracking()
            .Where(x => x.IsActive && visibleIds.Contains(x.Id))
            .OrderBy(x => x.ParentId)
            .ThenBy(x => x.SortOrder)
            .Select(x => new MyMenuResponse(
                x.Id,
                x.ParentId,
                x.Label,
                x.Icon,
                x.TargetType,
                x.TargetValue,
                x.SortOrder,
                x.MaintenanceActive,
                x.MaintenanceTitle,
                x.MaintenanceMessage,
                new List<string>()
            ))
            .ToListAsync(cancellationToken);

        var menus = loaded
            .Select(x => x with
            {
                Actions = actionsByMenu.TryGetValue(x.Id, out var allowed)
                    ? allowed
                    : []
            })
            .ToList();

        var visible = menus.ToDictionary(x => x.Id);
        var removed = true;

        while (removed)
        {
            removed = false;

            foreach (var menu in visible.Values.ToList())
            {
                if (menu.ParentId is { } parentId &&
                    !visible.ContainsKey(parentId))
                {
                    visible.Remove(menu.Id);
                    removed = true;
                }
            }
        }

        return menus
            .Where(x => visible.ContainsKey(x.Id))
            .ToList();
    }
}
