#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Application.Common.Text;
using SsoLauncher.Application.Organization;
using SsoLauncher.Application.UserGroups.GroupNames;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.UserGroups.SaveUserGroup;

public sealed class CreateUserGroupService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader,
    DepartmentCatalog departmentCatalog)
{
    public async Task<long?> CreateAsync(
        SaveUserGroupRequest request,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        var name = TextFormat.Title(request.Name);
        var department = string.IsNullOrWhiteSpace(request.Department)
            ? null
            : request.Department.Trim();

        var departemenCode = await departmentCatalog.CodeOfAsync(
            department,
            cancellationToken
        );

        if (string.IsNullOrWhiteSpace(name) ||
            name.Length > GroupNameOptionsService.MaxNameLength ||
            departemenCode is null)
        {
            return null;
        }

        var exists = await dbContext.UserGroups
            .AnyAsync(
                x =>
                    x.DepartemenCode == departemenCode &&
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

        var group = new UserGroup
        {
            Name = name,
            Description = request.Description.Trim(),
            Department = department,
            DepartemenCode = departemenCode,
            IsActive = request.IsActive,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.UserGroups.Add(group);

        await dbContext.SaveChangesAsync(cancellationToken);

        var after = await snapshotReader.UserGroupAsync(
            group.Id,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            actorId,
            actorName,
            AuditActions.Create,
            AuditTargets.UserGroup,
            group.Id,
            group.Name,
            null,
            after,
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return group.Id;
    }
}
