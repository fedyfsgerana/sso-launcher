#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Application.Common.Text;
using SsoLauncher.Application.Organization;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.Users.CreateUser;

public sealed class CreateUserService(
    ISsoLauncherDbContext dbContext,
    IPasswordHasher passwordHasher,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader,
    DepartmentCatalog departmentCatalog)
{
    public async Task<long?> CreateAsync(
        CreateUserRequest request,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        var name = TextFormat.Title(request.Name);
        var employeeNumber = Normalize(request.EmployeeNumber);
        var department = Normalize(request.Department);
        var jobTitle = TextFormat.TitleOrNull(request.JobTitle);
        var departmentCode = await departmentCatalog.CodeOfAsync(
            department,
            cancellationToken
        );
        var email = EmailRules.Normalize(request.Email);

        if (string.IsNullOrWhiteSpace(name) ||
            departmentCode is null ||
            !EmailRules.IsValid(email) ||
            !PasswordRules.IsValid(request.Password))
        {
            return null;
        }

        var emailExists = await dbContext.Users
            .AnyAsync(
                x => x.Email == email,
                cancellationToken
            );

        if (emailExists)
        {
            return null;
        }

        if (employeeNumber is not null)
        {
            var employeeNumberExists = await dbContext.Users
                .AnyAsync(
                    x => x.EmployeeNumber == employeeNumber,
                    cancellationToken
                );

            if (employeeNumberExists)
            {
                return null;
            }
        }

        var groupIds = (request.GroupIds ?? [])
            .Distinct()
            .ToList();

        List<long> validGroups = groupIds.Count == 0
            ? []
            : await dbContext.UserGroups
                .Where(x => groupIds.Contains(x.Id))
                .Select(x => x.Id)
                .ToListAsync(cancellationToken);

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var groupsBefore = await snapshotReader.UserGroupsAsync(
            validGroups,
            cancellationToken
        );

        var now = DateTimeOffset.UtcNow;
        var user = new User
        {
            Name = name,
            Email = email,
            PasswordHash = passwordHasher.Hash(request.Password),
            EmployeeNumber = employeeNumber,
            Department = department,
            DepartemenCode = departmentCode,
            JobTitle = jobTitle,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.Users.Add(user);

        foreach (var groupId in validGroups)
        {
            dbContext.UserGroupMembers.Add(new UserGroupMember
            {
                UserGroupId = groupId,
                User = user,
                CreatedAt = now
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var userId = user.Id;

        var after = await snapshotReader.UserAsync(
            userId,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            actorId,
            actorName,
            AuditActions.Create,
            AuditTargets.User,
            userId,
            name,
            null,
            after,
            validGroups.Count > 0
                ? $"{email}, langsung masuk {validGroups.Count} grup"
                : email,
            cancellationToken: cancellationToken
        );

        var groupsAfter = await snapshotReader.UserGroupsAsync(
            validGroups,
            cancellationToken
        );

        foreach (var (groupId, groupAfter) in groupsAfter)
        {
            await auditLogger.RecordChangeAsync(
                actorId,
                actorName,
                AuditActions.Update,
                AuditTargets.UserGroup,
                groupId,
                groupAfter.Name,
                groupsBefore.GetValueOrDefault(groupId),
                groupAfter,
                $"{name} ditambahkan sebagai anggota",
                cancellationToken: cancellationToken
            );
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return userId;
    }

    private static string? Normalize(string? value)
    {
        var trimmed = value?.Trim();

        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }
}
