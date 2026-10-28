#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.PortalMenus.Shared;
using SsoLauncher.Application.Audit;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.PortalMenus.ReorderPortalMenus;

public sealed class ReorderPortalMenusService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger)
{
    public async Task<bool> ReorderAsync(
        ReorderPortalMenusRequest request,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        if (request.Items.Count == 0)
        {
            return false;
        }

        if (request.Items.Select(x => x.Id).Distinct().Count() != request.Items.Count)
        {
            return false;
        }

        var menus = await dbContext.PortalMenus
            .ToListAsync(cancellationToken);

        if (menus.Count != request.Items.Count)
        {
            return false;
        }

        var itemById = request.Items.ToDictionary(x => x.Id);

        if (menus.Any(menu => !itemById.ContainsKey(menu.Id)))
        {
            return false;
        }

        var menuById = menus.ToDictionary(x => x.Id);

        foreach (var item in request.Items)
        {
            if (item.SortOrder < 0)
            {
                return false;
            }

            var current = menuById[item.Id];

            if (current.TargetType == PortalMenuTargetTypes.Section &&
                item.ParentId is not null)
            {
                return false;
            }

            if (current.TargetType != PortalMenuTargetTypes.Section &&
                item.ParentId is null &&
                current.ParentId is not null)
            {
                return false;
            }

            if (item.ParentId is null)
            {
                continue;
            }

            if (item.ParentId == item.Id ||
                !itemById.ContainsKey(item.ParentId.Value))
            {
                return false;
            }
        }

        var parentById = request.Items
            .ToDictionary(x => x.Id, x => x.ParentId);

        if (parentById.Keys.Any(id => PortalMenuRules.HasCycle(parentById, id)))
        {
            return false;
        }

        foreach (var group in request.Items.GroupBy(x => x.ParentId))
        {
            var expected = Enumerable.Range(0, group.Count()).ToArray();
            var actual = group
                .Select(x => x.SortOrder)
                .OrderBy(x => x)
                .ToArray();

            if (!actual.SequenceEqual(expected))
            {
                return false;
            }
        }

        var before = DescribePositions(menus);
        var now = DateTimeOffset.UtcNow;
        var moved = 0;

        foreach (var menu in menus)
        {
            var item = itemById[menu.Id];

            if (menu.ParentId == item.ParentId &&
                menu.SortOrder == item.SortOrder)
            {
                continue;
            }

            menu.ParentId = item.ParentId;
            menu.SortOrder = item.SortOrder;
            menu.UpdatedAt = now;
            moved += 1;
        }

        var after = DescribePositions(menus);

        auditLogger.RecordDiff(
            actorId,
            actorName,
            AuditActions.Update,
            AuditTargets.PortalMenu,
            null,
            "Urutan menu",
            before,
            after,
            $"{moved} dari {request.Items.Count} menu berpindah posisi"
        );

        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static Dictionary<string, string> DescribePositions(
        IReadOnlyList<PortalMenu> menus)
    {
        var labels = menus.ToDictionary(x => x.Id, x => x.Label);

        return menus.ToDictionary(
            x => $"{x.Label} [#{x.Id}]",
            x =>
            {
                var parent = x.ParentId is { } parentId &&
                             labels.TryGetValue(parentId, out var label)
                    ? label
                    : "Menu utama";

                return $"{parent} #{x.SortOrder + 1}";
            }
        );
    }
}
