using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;
using SsoLauncher.Application.Notifications;

namespace SsoLauncher.Application.UserGroups.ManageMembers;

public sealed class SetGroupMembersService(
    ISsoLauncherDbContext dbContext,
    Notifier notifier,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader)
{
    public async Task<bool> SetAsync(
        long groupId,
        SetGroupMembersRequest request,
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

        var userIds = request.UserIds
            .Distinct()
            .ToList();

        var validUsers = await dbContext.Users
            .Where(x =>
                userIds.Contains(x.Id) &&
                (group.DepartemenCode == null || x.DepartemenCode == group.DepartemenCode))
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        if (validUsers.Count != userIds.Count)
        {
            return false;
        }

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var accessBefore = await notifier.CaptureAccessAsync(
            (await dbContext.UserGroupMembers
                .Where(x => x.UserGroupId == groupId)
                .Select(x => x.UserId)
                .ToListAsync(cancellationToken)).Concat(userIds),
            cancellationToken
        );

        var before = await snapshotReader.UserGroupAsync(
            groupId,
            cancellationToken
        );

        var current = await dbContext.UserGroupMembers
            .Where(x => x.UserGroupId == groupId)
            .ToListAsync(cancellationToken);

        var removed = 0;

        foreach (var member in current)
        {
            if (!userIds.Contains(member.UserId))
            {
                dbContext.UserGroupMembers.Remove(member);
                removed += 1;
            }
        }

        var now = DateTimeOffset.UtcNow;
        var added = 0;

        foreach (var userId in userIds)
        {
            if (current.Any(x => x.UserId == userId))
            {
                continue;
            }

            dbContext.UserGroupMembers.Add(new UserGroupMember
            {
                UserGroupId = groupId,
                UserId = userId,
                CreatedAt = now
            });

            added += 1;
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
            AuditActions.Update,
            AuditTargets.UserGroup,
            groupId,
            group.Name,
            before,
            after,
            $"Anggota grup diperbarui: {added} ditambahkan, {removed} dikeluarkan, total {userIds.Count} anggota",
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return true;
    }
}
