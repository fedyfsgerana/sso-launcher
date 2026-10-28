using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.RecycleBin;

public sealed class RestoreRecordService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader,
    RestoreUserService restoreUser,
    RestoreApplicationService restoreApplication)
{
    public async Task<RestoreResult> RestoreAsync(
        string entityType,
        long id,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        switch (entityType)
        {
            case AuditTargets.User:
                return await restoreUser.RestoreAsync(
                    id,
                    actorId,
                    actorName,
                    cancellationToken
                );
            case AuditTargets.Application:
                return await restoreApplication.RestoreAsync(
                    id,
                    actorId,
                    actorName,
                    cancellationToken
                );
        }

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var outcome = entityType switch
        {
            AuditTargets.UserGroup =>
                await RestoreGroupAsync(id, cancellationToken),
            AuditTargets.PortalMenu =>
                await RestorePortalMenuAsync(id, cancellationToken),
            _ => Outcome.Fail(RestoreResult.NotFound)
        };

        if (outcome.Result != RestoreResult.Restored)
        {
            return outcome.Result;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        object? after = entityType switch
        {
            AuditTargets.UserGroup =>
                await snapshotReader.UserGroupAsync(id, cancellationToken),
            AuditTargets.PortalMenu =>
                await snapshotReader.PortalMenuAsync(id, cancellationToken),
            _ => null
        };

        await auditLogger.RecordChangeAsync(
            actorId,
            actorName,
            AuditActions.Restore,
            entityType,
            id,
            outcome.Name,
            outcome.Before,
            after,
            outcome.Summary,
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return RestoreResult.Restored;
    }

    private async Task<Outcome> RestoreGroupAsync(
        long groupId,
        CancellationToken cancellationToken)
    {
        var group = await dbContext.UserGroups
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(
                x =>
                    x.Id == groupId &&
                    x.DeletedAt != null,
                cancellationToken
            );

        if (group is null)
        {
            return Outcome.Fail(RestoreResult.NotFound);
        }

        var conflict = await dbContext.UserGroups
            .AnyAsync(
                x => x.Name == group.Name,
                cancellationToken
            );

        if (conflict)
        {
            return Outcome.Fail(RestoreResult.Conflict);
        }

        var before = await snapshotReader.UserGroupAsync(groupId, cancellationToken);

        group.DeletedAt = null;
        group.UpdatedAt = DateTimeOffset.UtcNow;

        return Outcome.Ok(
            before,
            group.Name,
            "Grup dipulihkan beserta anggota dan aksesnya"
        );
    }

    private async Task<Outcome> RestorePortalMenuAsync(
        long menuId,
        CancellationToken cancellationToken)
    {
        var menu = await dbContext.PortalMenus
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(
                x =>
                    x.Id == menuId &&
                    x.DeletedAt != null,
                cancellationToken
            );

        if (menu is null)
        {
            return Outcome.Fail(RestoreResult.NotFound);
        }

        var before = await snapshotReader.PortalMenuAsync(menuId, cancellationToken);

        var parentActive = menu.ParentId is not null &&
            await dbContext.PortalMenus.AnyAsync(
                x => x.Id == menu.ParentId,
                cancellationToken
            );

        var summary = "Menu dipulihkan";

        if (menu.ParentId is not null && !parentActive)
        {
            menu.ParentId = null;
            summary = "Menu dipulihkan ke menu utama karena induknya sudah dihapus";
        }

        menu.SortOrder = await dbContext.PortalMenus
            .CountAsync(
                x => x.ParentId == menu.ParentId,
                cancellationToken
            );

        menu.DeletedAt = null;
        menu.UpdatedAt = DateTimeOffset.UtcNow;

        return Outcome.Ok(before, menu.Label, summary);
    }

    private sealed record Outcome(
        RestoreResult Result,
        object? Before,
        string Name,
        string Summary)
    {
        public static Outcome Ok(object? before, string name, string summary)
        {
            return new Outcome(RestoreResult.Restored, before, name, summary);
        }

        public static Outcome Fail(RestoreResult result)
        {
            return new Outcome(result, null, string.Empty, string.Empty);
        }
    }
}