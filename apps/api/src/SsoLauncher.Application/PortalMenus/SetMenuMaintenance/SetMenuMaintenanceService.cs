using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Application.Common.Text;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.PortalMenus.SetMenuMaintenance;

public sealed class SetMenuMaintenanceService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader)
{
    private const int MaxTitle = 120;
    private const int MaxMessage = 500;

    public async Task<SetMenuMaintenanceResult> SetAsync(
        long menuId,
        SetMenuMaintenanceRequest request,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        var menu = await dbContext.PortalMenus
            .SingleOrDefaultAsync(x => x.Id == menuId, cancellationToken);

        if (menu is null)
        {
            return SetMenuMaintenanceResult.NotFound;
        }

        var title = TextFormat.Title(request.Title);
        var message = TextFormat.Sentence(request.Message);

        var hasChildren = request.Active &&
            await dbContext.PortalMenus
                .AsNoTracking()
                .AnyAsync(x => x.ParentId == menu.Id, cancellationToken);

        if (request.Active &&
            (menu.TargetType == PortalMenuTargetTypes.Section ||
             hasChildren ||
             title.Length is 0 or > MaxTitle ||
             message.Length > MaxMessage))
        {
            return SetMenuMaintenanceResult.Invalid;
        }

        var before = await snapshotReader.PortalMenuAsync(
            menuId,
            cancellationToken
        );

        menu.MaintenanceActive = request.Active;
        menu.MaintenanceTitle = request.Active ? title : null;
        menu.MaintenanceMessage = request.Active && message.Length > 0
            ? message
            : null;
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
            request.Active
                ? $"{menu.Label} ditandai sedang dalam perbaikan"
                : $"Mode perbaikan {menu.Label} dimatikan",
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);

        return SetMenuMaintenanceResult.Updated;
    }
}
