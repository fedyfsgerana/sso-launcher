using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;
using SsoLauncher.Application.Notifications;

namespace SsoLauncher.Application.UserGroups.ManageMembers;

public sealed class AddGroupMembersService(
    ISsoLauncherDbContext dbContext,
    Notifier notifier,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader)
{
    public async Task<int?> AddAsync(
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
            return null;
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

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var accessBefore = await notifier.CaptureAccessAsync(
            userIds,
            cancellationToken
        );

        var before = await snapshotReader.UserGroupAsync(
            groupId,
            cancellationToken
        );

        var existing = await dbContext.UserGroupMembers
            .Where(x =>
                x.UserGroupId == groupId &&
                validUsers.Contains(x.UserId))
            .Select(x => x.UserId)
            .ToListAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var added = 0;

        foreach (var userId in validUsers.Except(existing))
        {
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
            $"{added} pengguna ditambahkan ke grup",
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return added;
    }
}
