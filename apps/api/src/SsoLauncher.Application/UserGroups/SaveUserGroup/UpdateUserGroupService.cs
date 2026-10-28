#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Application.Common.Text;
using SsoLauncher.Application.Organization;
using SsoLauncher.Application.Notifications;
using SsoLauncher.Application.UserGroups.GroupNames;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.UserGroups.SaveUserGroup;

public sealed class UpdateUserGroupService(
    ISsoLauncherDbContext dbContext,
    Notifier notifier,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader,
    DepartmentCatalog departmentCatalog)
{
    public async Task<bool> UpdateAsync(
        long groupId,
        SaveUserGroupRequest request,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        var name = TextFormat.Title(request.Name);
        var department = string.IsNullOrWhiteSpace(request.Department)
            ? null
            : request.Department.Trim();

        if (string.IsNullOrWhiteSpace(name) ||
            name.Length > GroupNameOptionsService.MaxNameLength)
        {
            return false;
        }

        var group = await dbContext.UserGroups
            .SingleOrDefaultAsync(
                x => x.Id == groupId,
                cancellationToken
            );

        if (group is null)
        {
            return false;
        }

        var departemenCode =
            department == group.Department && group.DepartemenCode is not null
                ? group.DepartemenCode
                : await departmentCatalog.CodeOfAsync(department, cancellationToken);

        if (department != group.Department && departemenCode is null)
        {
            return false;
        }

        var duplicate = await dbContext.UserGroups
            .AnyAsync(
                x =>
                    x.Id != groupId &&
                    x.DepartemenCode == departemenCode &&
                    x.Name == name,
                cancellationToken
            );

        if (duplicate)
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

        group.Name = name;
        group.Description = request.Description.Trim();
        group.Department = department;
        group.DepartemenCode = departemenCode;
        group.IsActive = request.IsActive;
        group.UpdatedAt = DateTimeOffset.UtcNow;

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
            name,
            before,
            after,
            request.IsActive ? "Grup aktif" : "Grup nonaktif",
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return true;
    }
}
