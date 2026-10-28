#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.PortalMenus.DeletePortalMenu;

public sealed class DeletePortalMenuService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader)
{
    public async Task<DeletePortalMenuResult> DeleteAsync(
        long menuId,
        long actorId,
        string actorName,
        long? moveToId = null,
        CancellationToken cancellationToken = default)
    {
        var menu = await dbContext.PortalMenus
            .SingleOrDefaultAsync(
                x => x.Id == menuId,
                cancellationToken
            );

        if (menu is null)
        {
            return DeletePortalMenuResult.NotFound;
        }

        var isSection = menu.TargetType == PortalMenuTargetTypes.Section;

        if (menu.IsSystem && !isSection)
        {
            return DeletePortalMenuResult.SystemMenu;
        }

        if (isSection &&
            moveToId is null &&
            await dbContext.PortalMenus
                .AsNoTracking()
                .AnyAsync(x => x.ParentId == menuId, cancellationToken))
        {
            return DeletePortalMenuResult.HasChildren;
        }

        var targetParentId = isSection ? moveToId : moveToId ?? menu.ParentId;

        if (moveToId is not null &&
            !await IsValidMoveTargetAsync(menu, moveToId.Value, cancellationToken))
        {
            return DeletePortalMenuResult.InvalidTarget;
        }

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var children = await dbContext.PortalMenus
            .Where(x => x.ParentId == menuId)
            .OrderBy(x => x.SortOrder)
            .ToListAsync(cancellationToken);

        if (children.Count > 0)
        {
            var nextOrder = await dbContext.PortalMenus
                .Where(x => x.ParentId == targetParentId && x.Id != menuId)
                .Select(x => (int?)x.SortOrder)
                .MaxAsync(cancellationToken) ?? -1;
            var now = DateTimeOffset.UtcNow;

            foreach (var child in children)
            {
                child.ParentId = targetParentId;
                child.SortOrder = ++nextOrder;
                child.UpdatedAt = now;
            }
        }

        var before = await snapshotReader.PortalMenuAsync(
            menuId,
            cancellationToken
        );

        dbContext.PortalMenus.Remove(menu);

        await dbContext.SaveChangesAsync(cancellationToken);

        var after = await snapshotReader.PortalMenuAsync(
            menuId,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            actorId,
            actorName,
            AuditActions.Delete,
            AuditTargets.PortalMenu,
            menuId,
            menu.Label,
            before,
            after,
            menu.TargetValue,
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return DeletePortalMenuResult.Deleted;
    }

    private async Task<bool> IsValidMoveTargetAsync(
        PortalMenu menu,
        long targetId,
        CancellationToken cancellationToken)
    {
        if (targetId == menu.Id)
        {
            return false;
        }

        var all = await dbContext.PortalMenus
            .AsNoTracking()
            .Select(x => new { x.Id, x.ParentId, x.TargetType })
            .ToListAsync(cancellationToken);

        var target = all.SingleOrDefault(x => x.Id == targetId);

        if (target is null)
        {
            return false;
        }

        var isSection = menu.TargetType == PortalMenuTargetTypes.Section;

        if (isSection != (target.TargetType == PortalMenuTargetTypes.Section))
        {
            return false;
        }

        var parentById = all.ToDictionary(x => x.Id, x => x.ParentId);
        var current = target.ParentId;

        while (current is { } parentId)
        {
            if (parentId == menu.Id)
            {
                return false;
            }

            current = parentById.GetValueOrDefault(parentId);
        }

        return true;
    }
}
