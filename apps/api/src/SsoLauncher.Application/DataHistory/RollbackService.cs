#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.DataHistory;

public sealed class RollbackService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader)
{
    public async Task<RollbackResult> RollbackAsync(
        string entityType,
        long entityId,
        RollbackRequest request,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        if (!VersionedEntityTypes.CanRollback(entityType))
        {
            return RollbackResult.Unsupported;
        }

        var version = await dbContext.DataVersions
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x =>
                    x.EntityType == entityType &&
                    x.EntityId == entityId &&
                    x.Version == request.Version,
                cancellationToken
            );

        if (version is null)
        {
            return RollbackResult.VersionNotFound;
        }

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var outcome = entityType switch
        {
            AuditTargets.User =>
                await RollbackUserAsync(entityId, version.Snapshot, cancellationToken),
            AuditTargets.Application =>
                await RollbackApplicationAsync(entityId, version.Snapshot, cancellationToken),
            AuditTargets.UserGroup =>
                await RollbackUserGroupAsync(entityId, version.Snapshot, cancellationToken),
            AuditTargets.PortalMenu =>
                await RollbackPortalMenuAsync(entityId, version.Snapshot, cancellationToken),
            _ => Outcome.Fail(RollbackResult.Unsupported)
        };

        if (outcome.Result != RollbackResult.RolledBack)
        {
            return outcome.Result;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var after = await ReadSnapshotAsync(
            entityType,
            entityId,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            actorId,
            actorName,
            AuditActions.Rollback,
            entityType,
            entityId,
            outcome.Name,
            outcome.Before,
            after,
            $"Dikembalikan ke versi {request.Version}",
            request.Reason,
            cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return RollbackResult.RolledBack;
    }

    private async Task<Outcome> RollbackUserAsync(
        long userId,
        string json,
        CancellationToken cancellationToken)
    {
        var target = AuditSnapshot.Deserialize<UserAuditSnapshot>(json);

        if (target is null)
        {
            return Outcome.Fail(RollbackResult.Unsupported);
        }

        if (target.Deleted)
        {
            return Outcome.Fail(RollbackResult.DeletedVersion);
        }

        var user = await dbContext.Users
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(
                x => x.Id == userId,
                cancellationToken
            );

        if (user is null)
        {
            return Outcome.Fail(RollbackResult.NotFound);
        }

        var conflict = await dbContext.Users
            .AnyAsync(
                x =>
                    x.Id != userId &&
                    (x.Email == target.Email ||
                     (target.EmployeeNumber != null &&
                      x.EmployeeNumber == target.EmployeeNumber)),
                cancellationToken
            );

        if (conflict)
        {
            return Outcome.Fail(RollbackResult.Conflict);
        }

        var before = await snapshotReader.UserAsync(userId, cancellationToken);
        var wasActive = user.IsActive && user.DeletedAt is null;
        var now = DateTimeOffset.UtcNow;

        user.Name = target.Name;
        user.Email = target.Email;
        user.EmployeeNumber = target.EmployeeNumber;
        user.Department = target.Department;
        user.DepartemenCode = target.DepartemenCode ?? Departments.CodeOf(target.Department);
        user.JobTitle = target.JobTitle;
        user.IsActive = target.IsActive;
        user.DeletedAt = null;
        user.UpdatedAt = now;

        if (wasActive && !target.IsActive)
        {
            var sessions = await dbContext.RefreshTokens
                .Where(x =>
                    x.UserId == userId &&
                    x.RevokedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var session in sessions)
            {
                session.RevokedAt = now;
            }
        }

        return Outcome.Ok(before, user.Name);
    }

    private async Task<Outcome> RollbackApplicationAsync(
        long applicationId,
        string json,
        CancellationToken cancellationToken)
    {
        var target = AuditSnapshot.Deserialize<ApplicationAuditSnapshot>(json);

        if (target is null)
        {
            return Outcome.Fail(RollbackResult.Unsupported);
        }

        if (target.Deleted)
        {
            return Outcome.Fail(RollbackResult.DeletedVersion);
        }

        var application = await dbContext.Applications
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(
                x => x.Id == applicationId,
                cancellationToken
            );

        if (application is null)
        {
            return Outcome.Fail(RollbackResult.NotFound);
        }

        var conflict = await dbContext.Applications
            .AnyAsync(
                x =>
                    x.Id != applicationId &&
                    x.Slug == target.Slug,
                cancellationToken
            );

        if (conflict || !ApplicationStatuses.IsValid(target.Status))
        {
            return Outcome.Fail(RollbackResult.Conflict);
        }

        var before = await snapshotReader.ApplicationAsync(applicationId, cancellationToken);

        application.Name = target.Name;
        application.Slug = target.Slug;
        application.Description = target.Description;
        application.LaunchUrl = target.LaunchUrl;
        application.Category = target.Category;
        application.Icon = target.Icon;
        application.Color = target.Color;
        application.Status = target.Status;
        application.MaintenanceMessage = target.MaintenanceMessage;
        application.UsesSso = target.UsesSso ?? true;
        application.IsActive = target.IsActive;
        application.DeletedAt = null;
        application.UpdatedAt = DateTimeOffset.UtcNow;

        return Outcome.Ok(before, application.Name);
    }

    private async Task<Outcome> RollbackUserGroupAsync(
        long groupId,
        string json,
        CancellationToken cancellationToken)
    {
        var target = AuditSnapshot.Deserialize<UserGroupAuditSnapshot>(json);

        if (target is null)
        {
            return Outcome.Fail(RollbackResult.Unsupported);
        }

        if (target.Deleted)
        {
            return Outcome.Fail(RollbackResult.DeletedVersion);
        }

        var group = await dbContext.UserGroups
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(
                x => x.Id == groupId,
                cancellationToken
            );

        if (group is null)
        {
            return Outcome.Fail(RollbackResult.NotFound);
        }

        var conflict = await dbContext.UserGroups
            .AnyAsync(
                x =>
                    x.Id != groupId &&
                    x.Name == target.Name,
                cancellationToken
            );

        if (conflict)
        {
            return Outcome.Fail(RollbackResult.Conflict);
        }

        var before = await snapshotReader.UserGroupAsync(groupId, cancellationToken);
        var now = DateTimeOffset.UtcNow;

        group.Name = target.Name;
        group.Description = target.Description;
        group.Department = target.Department;
        group.DepartemenCode = target.DepartemenCode ?? Departments.CodeOf(target.Department);
        group.IsActive = target.IsActive;
        group.DeletedAt = null;
        group.UpdatedAt = now;

        var wantedUserIds = target.Members
            .Select(x => x.Id)
            .Distinct()
            .ToList();

        var activeUserIds = await dbContext.Users
            .Where(x => wantedUserIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        var members = await dbContext.UserGroupMembers
            .IgnoreQueryFilters()
            .Where(x =>
                x.UserGroupId == groupId &&
                x.DeletedAt == null &&
                x.User.DeletedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var member in members)
        {
            if (!activeUserIds.Contains(member.UserId))
            {
                dbContext.UserGroupMembers.Remove(member);
            }
        }

        foreach (var userId in activeUserIds)
        {
            if (members.Any(x => x.UserId == userId))
            {
                continue;
            }

            dbContext.UserGroupMembers.Add(new UserGroupMember
            {
                UserGroupId = groupId,
                UserId = userId,
                CreatedAt = now
            });
        }

        var wantedApplications = target.Applications
            .GroupBy(x => x.Id)
            .Select(x => x.First())
            .ToList();

        var wantedApplicationIds = wantedApplications
            .Select(x => x.Id)
            .ToList();

        var activeApplicationIds = await dbContext.Applications
            .Where(x => wantedApplicationIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        var accesses = await dbContext.UserGroupApplicationAccesses
            .IgnoreQueryFilters()
            .Where(x =>
                x.UserGroupId == groupId &&
                x.DeletedAt == null &&
                x.Application.DeletedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var access in accesses)
        {
            if (!activeApplicationIds.Contains(access.ApplicationId))
            {
                dbContext.UserGroupApplicationAccesses.Remove(access);
            }
        }

        foreach (var wanted in wantedApplications)
        {
            if (!activeApplicationIds.Contains(wanted.Id))
            {
                continue;
            }

            var existing = accesses.SingleOrDefault(
                x => x.ApplicationId == wanted.Id
            );

            if (existing is null)
            {
                dbContext.UserGroupApplicationAccesses.Add(
                    new UserGroupApplicationAccess
                    {
                        UserGroupId = groupId,
                        ApplicationId = wanted.Id,
                        CreatedAt = now,
                        UpdatedAt = now
                    }
                );
            }
        }

        var wantedMenuIds = target.Menus
            .Select(x => x.Id)
            .Distinct()
            .ToList();

        var activeMenuIds = await dbContext.PortalMenus
            .Where(x => wantedMenuIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        var menuAccesses = await dbContext.UserGroupMenuAccesses
            .IgnoreQueryFilters()
            .Where(x =>
                x.UserGroupId == groupId &&
                x.DeletedAt == null &&
                x.PortalMenu.DeletedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var access in menuAccesses)
        {
            if (!activeMenuIds.Contains(access.PortalMenuId))
            {
                dbContext.UserGroupMenuAccesses.Remove(access);
            }
        }

        foreach (var menuId in activeMenuIds)
        {
            if (menuAccesses.Any(x => x.PortalMenuId == menuId))
            {
                continue;
            }

            dbContext.UserGroupMenuAccesses.Add(new UserGroupMenuAccess
            {
                UserGroupId = groupId,
                PortalMenuId = menuId,
                CreatedAt = now
            });
        }

        return Outcome.Ok(before, group.Name);
    }

    private async Task<Outcome> RollbackPortalMenuAsync(
        long menuId,
        string json,
        CancellationToken cancellationToken)
    {
        var target = AuditSnapshot.Deserialize<PortalMenuAuditSnapshot>(json);

        if (target is null)
        {
            return Outcome.Fail(RollbackResult.Unsupported);
        }

        if (target.Deleted)
        {
            return Outcome.Fail(RollbackResult.DeletedVersion);
        }

        var menu = await dbContext.PortalMenus
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(
                x => x.Id == menuId,
                cancellationToken
            );

        if (menu is null)
        {
            return Outcome.Fail(RollbackResult.NotFound);
        }

        var before = await snapshotReader.PortalMenuAsync(menuId, cancellationToken);
        var now = DateTimeOffset.UtcNow;
        var wasDeleted = menu.DeletedAt is not null;

        var hasChildren = await dbContext.PortalMenus
            .AnyAsync(
                x => x.ParentId == menuId,
                cancellationToken
            );

        long? parentId = null;

        if (target.ParentId is { } wantedParent &&
            wantedParent != menuId &&
            !hasChildren &&
            await dbContext.PortalMenus.AnyAsync(
                x =>
                    x.Id == wantedParent &&
                    x.ParentId == null,
                cancellationToken))
        {
            parentId = wantedParent;
        }

        if (wasDeleted || menu.ParentId != parentId)
        {
            menu.SortOrder = await dbContext.PortalMenus
                .CountAsync(
                    x =>
                        x.Id != menuId &&
                        x.ParentId == parentId,
                    cancellationToken
                );
        }

        menu.ParentId = parentId;
        menu.Label = target.Label;
        menu.Icon = target.Icon;

        if (!menu.IsSystem &&
            PortalMenuTargetTypes.IsValid(target.TargetType))
        {
            menu.TargetType = target.TargetType;
            menu.TargetValue = target.TargetValue;
        }

        menu.IsActive = target.IsActive;
        menu.DeletedAt = null;
        menu.UpdatedAt = now;

        var wantedGroupIds = target.Groups
            .Select(x => x.Id)
            .Distinct()
            .ToList();

        var activeGroupIds = await dbContext.UserGroups
            .Where(x => wantedGroupIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        var accesses = await dbContext.UserGroupMenuAccesses
            .IgnoreQueryFilters()
            .Where(x =>
                x.PortalMenuId == menuId &&
                x.DeletedAt == null &&
                x.UserGroup.DeletedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var access in accesses)
        {
            if (!activeGroupIds.Contains(access.UserGroupId))
            {
                dbContext.UserGroupMenuAccesses.Remove(access);
            }
        }

        foreach (var groupId in activeGroupIds)
        {
            if (accesses.Any(x => x.UserGroupId == groupId))
            {
                continue;
            }

            dbContext.UserGroupMenuAccesses.Add(new UserGroupMenuAccess
            {
                UserGroupId = groupId,
                PortalMenuId = menuId,
                CreatedAt = now
            });
        }

        return Outcome.Ok(before, menu.Label);
    }

    private async Task<object?> ReadSnapshotAsync(
        string entityType,
        long entityId,
        CancellationToken cancellationToken)
    {
        return entityType switch
        {
            AuditTargets.User =>
                await snapshotReader.UserAsync(entityId, cancellationToken),
            AuditTargets.Application =>
                await snapshotReader.ApplicationAsync(entityId, cancellationToken),
            AuditTargets.UserGroup =>
                await snapshotReader.UserGroupAsync(entityId, cancellationToken),
            AuditTargets.PortalMenu =>
                await snapshotReader.PortalMenuAsync(entityId, cancellationToken),
            _ => null
        };
    }

    private sealed record Outcome(
        RollbackResult Result,
        object? Before,
        string Name)
    {
        public static Outcome Ok(object? before, string name)
        {
            return new Outcome(RollbackResult.RolledBack, before, name);
        }

        public static Outcome Fail(RollbackResult result)
        {
            return new Outcome(result, null, string.Empty);
        }
    }
}
