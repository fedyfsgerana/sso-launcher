using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.PortalMenus.SetMenuGroups;

public sealed class SetMenuGroupsService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader)
{
    public async Task<bool> SetAsync(
        long menuId,
        SetMenuGroupsRequest request,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        var menu = await dbContext.PortalMenus
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.Id == menuId,
                cancellationToken
            );

        if (menu is null)
        {
            return false;
        }

        var groupIds = request.GroupIds
            .Distinct()
            .ToList();

        var validGroups = await dbContext.UserGroups
            .Where(x => groupIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        if (validGroups.Count != groupIds.Count)
        {
            return false;
        }

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var current = await dbContext.UserGroupMenuAccesses
            .Where(x => x.PortalMenuId == menuId)
            .ToListAsync(cancellationToken);

        var affectedGroups = current
            .Select(x => x.UserGroupId)
            .Where(x => !groupIds.Contains(x))
            .Concat(groupIds.Where(x => current.All(access => access.UserGroupId != x)))
            .Distinct()
            .ToList();

        var menuBefore = await snapshotReader.PortalMenuAsync(
            menuId,
            cancellationToken
        );

        var groupsBefore = await snapshotReader.UserGroupsAsync(
            affectedGroups,
            cancellationToken
        );

        foreach (var access in current)
        {
            if (!groupIds.Contains(access.UserGroupId))
            {
                dbContext.UserGroupMenuAccesses.Remove(access);
            }
        }

        var now = DateTimeOffset.UtcNow;

        foreach (var groupId in groupIds)
        {
            if (current.Any(x => x.UserGroupId == groupId))
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

        await dbContext.SaveChangesAsync(cancellationToken);

        var menuAfter = await snapshotReader.PortalMenuAsync(
            menuId,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            actorId,
            actorName,
            AuditActions.Grant,
            AuditTargets.PortalMenu,
            menuId,
            menu.Label,
            menuBefore,
            menuAfter,
            $"Akses menu diberikan ke {groupIds.Count} grup",
            cancellationToken: cancellationToken
        );

        var groupsAfter = await snapshotReader.UserGroupsAsync(
            affectedGroups,
            cancellationToken
        );

        foreach (var (groupId, groupAfter) in groupsAfter)
        {
            await auditLogger.RecordChangeAsync(
                actorId,
                actorName,
                AuditActions.Grant,
                AuditTargets.UserGroup,
                groupId,
                groupAfter.Name,
                groupsBefore.GetValueOrDefault(groupId),
                groupAfter,
                $"Akses menu {menu.Label} diubah dari pengaturan menu",
                cancellationToken: cancellationToken
            );
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return true;
    }
}
