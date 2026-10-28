#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Application.Common.Text;
using SsoLauncher.Application.UserGroups.GroupNames;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.UserGroups.DuplicateUserGroup;

public sealed class DuplicateUserGroupService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader)
{
    public async Task<long?> DuplicateAsync(
        long groupId,
        DuplicateUserGroupRequest request,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        var name = TextFormat.Title(request.Name);

        if (string.IsNullOrWhiteSpace(name) ||
            name.Length > GroupNameOptionsService.MaxNameLength)
        {
            return null;
        }

        var source = await dbContext.UserGroups
            .AsNoTracking()
            .Include(x => x.Accesses)
            .Include(x => x.MenuAccesses)
            .SingleOrDefaultAsync(
                x => x.Id == groupId,
                cancellationToken
            );

        if (source is null)
        {
            return null;
        }

        var exists = await dbContext.UserGroups
            .AnyAsync(
                x =>
                    x.DepartemenCode == source.DepartemenCode &&
                    x.Name == name,
                cancellationToken
            );

        if (exists)
        {
            return null;
        }

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;

        var copy = new UserGroup
        {
            Name = name,
            Description = source.Description,
            Department = source.Department,
            DepartemenCode = source.DepartemenCode,
            IsActive = source.IsActive,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.UserGroups.Add(copy);

        foreach (var access in source.Accesses)
        {
            dbContext.UserGroupApplicationAccesses.Add(
                new UserGroupApplicationAccess
                {
                    UserGroup = copy,
                    ApplicationId = access.ApplicationId,
                    CreatedAt = now,
                    UpdatedAt = now
                }
            );
        }

        foreach (var access in source.MenuAccesses)
        {
            dbContext.UserGroupMenuAccesses.Add(new UserGroupMenuAccess
            {
                UserGroup = copy,
                PortalMenuId = access.PortalMenuId,
                CreatedAt = now
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var after = await snapshotReader.UserGroupAsync(
            copy.Id,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            actorId,
            actorName,
            AuditActions.Create,
            AuditTargets.UserGroup,
            copy.Id,
            copy.Name,
            null,
            after,
            $"Disalin dari grup {source.Name} beserta {source.Accesses.Count} akses aplikasi dan {source.MenuAccesses.Count} akses menu",
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return copy.Id;
    }
}
