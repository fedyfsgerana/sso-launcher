using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.UserGroups.ManageMenuAccess;

public sealed class SetGroupMenuAccessService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader)
{
    public async Task<bool> SetAsync(
        long groupId,
        SetGroupMenuAccessRequest request,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        var group = await dbContext.UserGroups
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.Id == groupId,
                cancellationToken
            );

        if (group is null)
        {
            return false;
        }

        var menuIds = request.MenuIds
            .Distinct()
            .ToList();

        var validMenus = await dbContext.PortalMenus
            .Where(x => menuIds.Contains(x.Id))
            .Select(x => new { x.Id, x.TargetType, x.TargetValue })
            .ToListAsync(cancellationToken);

        if (validMenus.Count != menuIds.Count)
        {
            return false;
        }

        var targetByMenu = validMenus.ToDictionary(
            x => x.Id,
            x => x.TargetType == PortalMenuTargetTypes.Page
                ? x.TargetValue.Trim().Trim('/')
                : string.Empty
        );

        var actions = (request.Actions ?? [])
            .Where(x =>
                targetByMenu.TryGetValue(x.MenuId, out var target) &&
                MenuActions.Exists(target, x.ActionKey))
            .Select(x => (x.MenuId, x.ActionKey))
            .Distinct()
            .ToList();

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var before = await snapshotReader.UserGroupAsync(
            groupId,
            cancellationToken
        );

        var current = await dbContext.UserGroupMenuAccesses
            .Where(x => x.UserGroupId == groupId)
            .ToListAsync(cancellationToken);

        foreach (var access in current)
        {
            if (!menuIds.Contains(access.PortalMenuId))
            {
                dbContext.UserGroupMenuAccesses.Remove(access);
            }
        }

        var now = DateTimeOffset.UtcNow;

        foreach (var menuId in menuIds)
        {
            if (current.Any(x => x.PortalMenuId == menuId))
            {
                continue;
            }

            dbContext.UserGroupMenuAccesses.Add(new UserGroupMenuAccess
            {
                UserGroupId = groupId,
                PortalMenuId = menuId,
                CreatedAt = now
            });
        }

        var currentActions = await dbContext.UserGroupMenuActions
            .Where(x => x.UserGroupId == groupId)
            .ToListAsync(cancellationToken);

        foreach (var action in currentActions)
        {
            if (!actions.Contains((action.PortalMenuId, action.ActionKey)))
            {
                dbContext.UserGroupMenuActions.Remove(action);
            }
        }

        foreach (var (menuId, actionKey) in actions)
        {
            if (currentActions.Any(x =>
                    x.PortalMenuId == menuId &&
                    x.ActionKey == actionKey))
            {
                continue;
            }

            dbContext.UserGroupMenuActions.Add(new UserGroupMenuAction
            {
                UserGroupId = groupId,
                PortalMenuId = menuId,
                ActionKey = actionKey,
                CreatedAt = now
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var after = await snapshotReader.UserGroupAsync(
            groupId,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            actorId,
            actorName,
            AuditActions.Grant,
            AuditTargets.UserGroup,
            groupId,
            group.Name,
            before,
            after,
            menuIds.Count == 0
                ? "Grup mengikuti menu umum"
                : $"Akses menu grup diperbarui menjadi {menuIds.Count} menu dan {actions.Count} aksi",
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return true;
    }
}
