#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;

namespace SsoLauncher.Application.Audit.Snapshots;

public sealed class AuditSnapshotReader(
    ISsoLauncherDbContext dbContext)
{
    public async Task<UserAuditSnapshot?> UserAsync(
        long userId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(x => x.Id == userId)
            .Select(x => new UserAuditSnapshot(
                x.Name,
                x.Email,
                x.EmployeeNumber,
                x.Department,
                x.DepartemenCode,
                x.JobTitle,
                x.IsActive,
                x.DeletedAt != null
            ))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<ApplicationAuditSnapshot?> ApplicationAsync(
        long applicationId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Applications
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(x => x.Id == applicationId)
            .Select(x => new ApplicationAuditSnapshot(
                x.Name,
                x.Slug,
                x.Description,
                x.LaunchUrl,
                x.Category,
                x.Icon,
                x.Color,
                x.Status,
                x.MaintenanceMessage,
                x.IsActive,
                x.DeletedAt != null,
                x.UsesSso
            ))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<UserGroupAuditSnapshot?> UserGroupAsync(
        long groupId,
        CancellationToken cancellationToken = default)
    {
        var group = await dbContext.UserGroups
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(x => x.Id == groupId)
            .Select(x => new
            {
                x.Name,
                x.Description,
                x.Department,
                x.DepartemenCode,
                x.IsActive,
                Deleted = x.DeletedAt != null
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (group is null)
        {
            return null;
        }

        var members = await dbContext.UserGroupMembers
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(x =>
                x.UserGroupId == groupId &&
                x.DeletedAt == null &&
                x.User.DeletedAt == null)
            .OrderBy(x => x.User.Name)
            .ThenBy(x => x.UserId)
            .Select(x => new AuditReference(
                x.UserId,
                x.User.Name
            ))
            .ToListAsync(cancellationToken);

        var applications = await dbContext.UserGroupApplicationAccesses
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(x =>
                x.UserGroupId == groupId &&
                x.DeletedAt == null &&
                x.Application.DeletedAt == null)
            .OrderBy(x => x.Application.Name)
            .ThenBy(x => x.ApplicationId)
            .Select(x => new AuditApplicationGrant(
                x.ApplicationId,
                x.Application.Name
            ))
            .ToListAsync(cancellationToken);

        var menus = await dbContext.UserGroupMenuAccesses
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(x =>
                x.UserGroupId == groupId &&
                x.DeletedAt == null &&
                x.PortalMenu.DeletedAt == null)
            .OrderBy(x => x.PortalMenu.Label)
            .ThenBy(x => x.PortalMenuId)
            .Select(x => new AuditReference(
                x.PortalMenuId,
                x.PortalMenu.Label
            ))
            .ToListAsync(cancellationToken);

        return new UserGroupAuditSnapshot(
            group.Name,
            group.Description,
            group.Department,
            group.DepartemenCode,
            group.IsActive,
            group.Deleted,
            members,
            applications,
            menus
        );
    }

    public async Task<Dictionary<long, UserGroupAuditSnapshot>> UserGroupsAsync(
        IEnumerable<long> groupIds,
        CancellationToken cancellationToken = default)
    {
        var result = new Dictionary<long, UserGroupAuditSnapshot>();

        foreach (var groupId in groupIds.Distinct())
        {
            var snapshot = await UserGroupAsync(groupId, cancellationToken);

            if (snapshot is not null)
            {
                result[groupId] = snapshot;
            }
        }

        return result;
    }

    public async Task<PortalMenuAuditSnapshot?> PortalMenuAsync(
        long menuId,
        CancellationToken cancellationToken = default)
    {
        var menu = await dbContext.PortalMenus
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(x => x.Id == menuId)
            .Select(x => new
            {
                x.ParentId,
                x.Label,
                x.Icon,
                x.TargetType,
                x.TargetValue,
                x.IsActive,
                x.MaintenanceActive,
                x.MaintenanceTitle,
                x.MaintenanceMessage,
                Deleted = x.DeletedAt != null
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (menu is null)
        {
            return null;
        }

        var groups = await dbContext.UserGroupMenuAccesses
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(x =>
                x.PortalMenuId == menuId &&
                x.DeletedAt == null &&
                x.UserGroup.DeletedAt == null)
            .OrderBy(x => x.UserGroup.Name)
            .ThenBy(x => x.UserGroupId)
            .Select(x => new AuditReference(
                x.UserGroupId,
                x.UserGroup.Name
            ))
            .ToListAsync(cancellationToken);

        return new PortalMenuAuditSnapshot(
            menu.ParentId,
            menu.Label,
            menu.Icon,
            menu.TargetType,
            menu.TargetValue,
            menu.IsActive,
            menu.MaintenanceActive,
            menu.MaintenanceTitle,
            menu.MaintenanceMessage,
            menu.Deleted,
            groups
        );
    }

    public async Task<ServiceCredentialAuditSnapshot?> ServiceCredentialAsync(
        long credentialId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.ApplicationServiceCredentials
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(x => x.Id == credentialId)
            .Select(x => new ServiceCredentialAuditSnapshot(
                x.ApplicationId,
                x.ClientId,
                x.Scope,
                x.IsActive,
                x.DeletedAt != null
            ))
            .SingleOrDefaultAsync(cancellationToken);
    }
}
