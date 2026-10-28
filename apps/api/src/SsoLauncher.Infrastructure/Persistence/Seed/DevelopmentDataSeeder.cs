#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Seed;

public sealed class DevelopmentDataSeeder(
    SsoLauncherDbContext dbContext,
    IPasswordHasher passwordHasher)
{
    private const string AdministratorEmail = "administrator@example.com";
    private const string AdministratorName = "Administrator";
    private const string AdministratorDepartment = "Information Technology";
    private const string AdministratorDepartemenCode = "IT";
    private const string AdministratorJobTitle = "Programmer";
    private const string AdministratorPassword = "p@ssw0rd";
    private const string AdministratorEmployeeNumber = "10001";
    private const string AdministratorGroupName = "Administrator";
    private const string AdministratorGroupDescription = "Grup akses untuk administrator sistem";

    public async Task SeedAsync(
        CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;

        var admin = await SeedAdministratorAsync(now, cancellationToken);
        await SeedMenusAsync(now, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        await SeedAdministratorGroupAsync(admin, now, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<User> SeedAdministratorAsync(
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var admin = await dbContext.Users
            .SingleOrDefaultAsync(
                x => x.Email == AdministratorEmail,
                cancellationToken
            );

        if (admin is not null)
        {
            var changed =
                admin.Email != AdministratorEmail ||
                admin.Name != AdministratorName ||
                admin.EmployeeNumber != AdministratorEmployeeNumber ||
                admin.Department != AdministratorDepartment ||
                admin.DepartemenCode != AdministratorDepartemenCode ||
                admin.JobTitle != AdministratorJobTitle ||
                !admin.IsActive;

            if (changed)
            {
                admin.Email = AdministratorEmail;
                admin.Name = AdministratorName;
                admin.EmployeeNumber = AdministratorEmployeeNumber;
                admin.Department = AdministratorDepartment;
                admin.DepartemenCode = AdministratorDepartemenCode;
                admin.JobTitle = AdministratorJobTitle;
                admin.IsActive = true;
                admin.UpdatedAt = now;
            }

            return admin;
        }

        admin = new User
        {
            Name = AdministratorName,
            Email = AdministratorEmail,
            PasswordHash = passwordHasher.Hash(AdministratorPassword),
            EmployeeNumber = AdministratorEmployeeNumber,
            Department = AdministratorDepartment,
            DepartemenCode = AdministratorDepartemenCode,
            JobTitle = AdministratorJobTitle,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.Users.Add(admin);

        return admin;
    }

    private async Task<Dictionary<string, long>> EnsureSectionsAsync(
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var sections = (await dbContext.PortalMenus
                .Where(x => x.TargetType == PortalMenuTargetTypes.Section)
                .OrderBy(x => x.Id)
                .ToListAsync(cancellationToken))
            .GroupBy(x => x.Label)
            .ToDictionary(group => group.Key, group => group.First());

        var map = new Dictionary<string, long>();
        var freshDatabase = sections.Count == 0;

        foreach (var section in PortalMenuDefaults.Sections)
        {
            if (sections.TryGetValue(section.Label, out var existing))
            {
                map[section.TargetValue] = existing.Id;
                continue;
            }

            if (!freshDatabase)
            {
                continue;
            }

            var created = new PortalMenu
            {
                ParentId = null,
                Label = section.Label,
                Icon = section.Icon,
                TargetType = PortalMenuTargetTypes.Section,
                TargetValue = string.Empty,
                SortOrder = section.SortOrder,
                IsSystem = section.IsSystem,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            dbContext.PortalMenus.Add(created);
            await dbContext.SaveChangesAsync(cancellationToken);

            map[section.TargetValue] = created.Id;
        }

        return map;
    }

    private async Task SeedMenusAsync(
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var sections = await EnsureSectionsAsync(now, cancellationToken);

        var existing = await dbContext.PortalMenus
            .Where(x => x.TargetType == PortalMenuTargetTypes.Page)
            .ToDictionaryAsync(x => x.TargetValue, cancellationToken);
        var menuIds = (await dbContext.PortalMenus
                .Select(x => x.Id)
                .ToListAsync(cancellationToken))
            .ToHashSet();

        foreach (var seed in PortalMenuDefaults.All)
        {
            long? parentId = seed.SectionKey is not null &&
                             sections.TryGetValue(seed.SectionKey, out var sectionId)
                ? sectionId
                : null;

            if (existing.TryGetValue(seed.TargetValue, out var menu))
            {
                if (menu.ParentId is { } currentParentId &&
                    !menuIds.Contains(currentParentId))
                {
                    menu.ParentId = parentId;
                    menu.UpdatedAt = now;
                }

                if (menu.IsSystem != seed.IsSystem)
                {
                    menu.IsSystem = seed.IsSystem;
                    menu.UpdatedAt = now;
                }

                continue;
            }

            dbContext.PortalMenus.Add(new PortalMenu
            {
                ParentId = parentId,
                Label = seed.Label,
                Icon = seed.Icon,
                TargetType = PortalMenuTargetTypes.Page,
                TargetValue = seed.TargetValue,
                SortOrder = seed.SortOrder,
                IsSystem = seed.IsSystem,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            });
        }
    }

    private async Task SeedAdministratorGroupAsync(
        User admin,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var group = await dbContext.UserGroups
            .Include(x => x.Members)
            .Include(x => x.MenuAccesses)
            .Include(x => x.Accesses)
            .SingleOrDefaultAsync(
                x => x.Name == AdministratorGroupName,
                cancellationToken
            );

        if (group is null)
        {
            group = new UserGroup
            {
                Name = AdministratorGroupName,
                CreatedAt = now
            };

            dbContext.UserGroups.Add(group);
        }

        if (group.Description != AdministratorGroupDescription ||
            group.Department != AdministratorDepartment ||
            group.DepartemenCode != AdministratorDepartemenCode ||
            !group.IsActive ||
            group.Id == 0)
        {
            group.Description = AdministratorGroupDescription;
            group.Department = AdministratorDepartment;
            group.DepartemenCode = AdministratorDepartemenCode;
            group.IsActive = true;
            group.UpdatedAt = now;
        }

        if (group.Members.All(x => x.UserId != admin.Id))
        {
            group.Members.Add(new UserGroupMember
            {
                UserId = admin.Id,
                CreatedAt = now
            });
        }

        var granted = group.MenuAccesses
            .Select(x => x.PortalMenuId)
            .ToHashSet();

        var menuIds = await dbContext.PortalMenus
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        foreach (var menuId in menuIds.Where(x => !granted.Contains(x)))
        {
            group.MenuAccesses.Add(new UserGroupMenuAccess
            {
                PortalMenuId = menuId,
                CreatedAt = now
            });
        }

        await GrantAllMenuActionsAsync(group, now, cancellationToken);

        var applicationIds = await dbContext.Applications
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        foreach (var applicationId in applicationIds.Where(id =>
                     group.Accesses.All(x => x.ApplicationId != id)))
        {
            group.Accesses.Add(new UserGroupApplicationAccess
            {
                ApplicationId = applicationId,
                CreatedAt = now,
                UpdatedAt = now
            });
        }
    }

    private async Task GrantAllMenuActionsAsync(
        UserGroup group,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);

        var menus = await dbContext.PortalMenus
            .Where(x => x.TargetType == PortalMenuTargetTypes.Page)
            .Select(x => new { x.Id, x.TargetValue })
            .ToListAsync(cancellationToken);

        var existing = await dbContext.UserGroupMenuActions
            .Where(x => x.UserGroupId == group.Id)
            .Select(x => new { x.PortalMenuId, x.ActionKey })
            .ToListAsync(cancellationToken);

        foreach (var menu in menus)
        {
            var target = menu.TargetValue.Trim().Trim('/');

            foreach (var action in MenuActions.For(target))
            {
                if (existing.Any(x =>
                        x.PortalMenuId == menu.Id &&
                        x.ActionKey == action.Key))
                {
                    continue;
                }

                dbContext.UserGroupMenuActions.Add(new UserGroupMenuAction
                {
                    UserGroupId = group.Id,
                    PortalMenuId = menu.Id,
                    ActionKey = action.Key,
                    CreatedAt = now
                });
            }
        }
    }
}
