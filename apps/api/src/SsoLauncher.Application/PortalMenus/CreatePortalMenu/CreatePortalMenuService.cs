#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Application.Common.Text;
using SsoLauncher.Application.PortalMenus.Shared;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.PortalMenus.CreatePortalMenu;

public sealed class CreatePortalMenuService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader)
{
    public async Task<long?> CreateAsync(
        CreatePortalMenuRequest request,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        if (!PortalMenuRules.IsValidDefinition(
                request.Label,
                request.Icon,
                request.TargetType,
                request.TargetValue))
        {
            return null;
        }

        if (!await IsValidParentAsync(
                request.ParentId,
                request.TargetType,
                cancellationToken))
        {
            return null;
        }

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;

        var sortOrder = await dbContext.PortalMenus
            .Where(x => x.ParentId == request.ParentId)
            .CountAsync(cancellationToken);

        var menu = new PortalMenu
        {
            ParentId = request.ParentId,
            Label = TextFormat.Title(request.Label),
            Icon = request.Icon?.Trim() ?? string.Empty,
            TargetType = request.TargetType,
            TargetValue =
                request.TargetType == PortalMenuTargetTypes.Section
                    ? string.Empty
                    : request.TargetValue.Trim(),
            SortOrder = sortOrder,
            IsSystem = false,
            IsActive = request.IsActive,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.PortalMenus.Add(menu);

        await dbContext.SaveChangesAsync(cancellationToken);

        var after = await snapshotReader.PortalMenuAsync(
            menu.Id,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            actorId,
            actorName,
            AuditActions.Create,
            AuditTargets.PortalMenu,
            menu.Id,
            menu.Label,
            null,
            after,
            $"Menu baru mengarah ke {menu.TargetValue}",
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return menu.Id;
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
