using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Application.Notifications;

namespace SsoLauncher.Application.UserGroups.DeleteUserGroup;

public sealed class DeleteUserGroupService(
    ISsoLauncherDbContext dbContext,
    Notifier notifier,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader)
{
    public async Task<bool> DeleteAsync(
        long groupId,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        var group = await dbContext.UserGroups
            .SingleOrDefaultAsync(
                x => x.Id == groupId,
                cancellationToken
            );

        if (group is null)
        {
            return false;
        }

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var accessBefore = await notifier.CaptureAccessAsync(
            (await dbContext.UserGroupMembers
                .Where(x => x.UserGroupId == groupId)
                .Select(x => x.UserId)
                .ToListAsync(cancellationToken)),
            cancellationToken
        );

        var before = await snapshotReader.UserGroupAsync(
            groupId,
            cancellationToken
        );

        dbContext.UserGroups.Remove(group);

        await dbContext.SaveChangesAsync(cancellationToken);

        await notifier.NotifyAccessChangesAsync(accessBefore, cancellationToken);

        var after = await snapshotReader.UserGroupAsync(
            groupId,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            actorId,
            actorName,
            AuditActions.Delete,
            AuditTargets.UserGroup,
            groupId,
            group.Name,
            before,
            after,
            $"Grup dipindahkan ke tempat sampah beserta {before?.Members.Count ?? 0} anggota, {before?.Applications.Count ?? 0} akses aplikasi, dan {before?.Menus.Count ?? 0} akses menu",
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return true;
    }
}
