#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Application.Common.Text;
using SsoLauncher.Application.PortalMenus.Shared;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.PortalMenus.UpdatePortalMenu;

public sealed class UpdatePortalMenuService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader)
{
    public async Task<UpdatePortalMenuResult> UpdateAsync(
        long menuId,
        UpdatePortalMenuRequest request,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        var menu = await dbContext.PortalMenus
            .SingleOrDefaultAsync(
                x => x.Id == menuId,
                cancellationToken
            );

        if (menu is null)
        {
            return UpdatePortalMenuResult.NotFound;
        }

        if (!PortalMenuRules.IsValidDefinition(
                request.Label,
                request.Icon,
                request.TargetType,
                request.TargetValue))
        {
            return UpdatePortalMenuResult.Invalid;
        }

        if (request.ParentId == menuId ||
            !await IsValidParentAsync(
                request.ParentId,
                request.TargetType,
                cancellationToken))
        {
            return UpdatePortalMenuResult.Invalid;
        }

        if (request.ParentId is not null)
        {
            var parents = await dbContext.PortalMenus
                .AsNoTracking()
                .Select(x => new { x.Id, x.ParentId })
                .ToDictionaryAsync(x => x.Id, x => x.ParentId, cancellationToken);

            parents[menuId] = request.ParentId;

            if (PortalMenuRules.HasCycle(parents, menuId))
            {
                return UpdatePortalMenuResult.Invalid;
            }
        }

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var before = await snapshotReader.PortalMenuAsync(
            menuId,
            cancellationToken
        );

        var hierarchyChanged =
            menu.ParentId != request.ParentId;

        if (hierarchyChanged)
        {
            menu.SortOrder = await dbContext.PortalMenus
                .Where(x =>
                    x.Id != menu.Id &&
                    x.ParentId == request.ParentId)
                .CountAsync(cancellationToken);
        }

        menu.Label = TextFormat.Title(request.Label);
        menu.Icon = request.Icon?.Trim() ?? string.Empty;
        menu.ParentId = request.ParentId;

        if (!menu.IsSystem)
        {
            menu.TargetType = request.TargetType;
            menu.TargetValue =
                request.TargetType == PortalMenuTargetTypes.Section
                    ? string.Empty
                    : request.TargetValue.Trim();
        }

        menu.IsActive = request.IsActive;
        menu.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var after = await snapshotReader.PortalMenuAsync(
            menuId,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            actorId,
            actorName,
            AuditActions.Update,
            AuditTargets.PortalMenu,
            menuId,
            menu.Label,
            before,
            after,
            menu.IsActive ? "Menu aktif" : "Menu disembunyikan",
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return UpdatePortalMenuResult.Updated;
    }

    private async Task<bool> IsValidParentAsync(
        long? parentId,
        string targetType,
        CancellationToken cancellationToken)
    {
        if (targetType == PortalMenuTargetTypes.Section)
        {
            return parentId is null;
        }

        if (parentId is null)
        {
            return false;
        }

        return await dbContext.PortalMenus
            .AsNoTracking()
            .AnyAsync(x => x.Id == parentId, cancellationToken);
    }
}
