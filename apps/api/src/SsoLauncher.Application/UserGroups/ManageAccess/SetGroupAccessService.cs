using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;
using SsoLauncher.Application.Notifications;

namespace SsoLauncher.Application.UserGroups.ManageAccess;

public sealed class SetGroupAccessService(
    ISsoLauncherDbContext dbContext,
    Notifier notifier,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader)
{
    public async Task<bool> SetAsync(
        long groupId,
        SetGroupAccessRequest request,
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

        var items = request.Accesses
            .GroupBy(x => x.ApplicationId)
            .Select(x => x.First())
            .ToList();

        var applicationIds = items
            .Select(x => x.ApplicationId)
            .ToList();

        var validApplications = await dbContext.Applications
            .Where(x => applicationIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        if (validApplications.Count != applicationIds.Count)
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

        var current = await dbContext.UserGroupApplicationAccesses
            .Where(x => x.UserGroupId == groupId)
            .ToListAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;

        foreach (var access in current)
        {
            if (!applicationIds.Contains(access.ApplicationId))
            {
                dbContext.UserGroupApplicationAccesses.Remove(access);
            }
        }

        foreach (var item in items)
        {
            var existing = current.SingleOrDefault(
                x => x.ApplicationId == item.ApplicationId
            );

            if (existing is null)
            {
                dbContext.UserGroupApplicationAccesses.Add(
                    new UserGroupApplicationAccess
                    {
                        UserGroupId = groupId,
                        ApplicationId = item.ApplicationId,
                        CreatedAt = now,
                        UpdatedAt = now
                    }
                );
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        await notifier.NotifyAccessChangesAsync(accessBefore, cancellationToken);

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
            $"Akses aplikasi grup diperbarui menjadi {items.Count} aplikasi",
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return true;
    }
}
