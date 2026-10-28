using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Common.Text;
using SsoLauncher.Application.Users;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Seed;

public sealed class PortalBootstrapper(
    SsoLauncherDbContext dbContext,
    IPasswordHasher passwordHasher,
    IConfiguration configuration,
    ILogger<PortalBootstrapper> logger)
{
    public const string SectionName = "Bootstrap";

    private const string AdministratorGroupName = "Administrator";
    private const string AdministratorGroupDescription = "Grup akses untuk administrator sistem";

    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;

        await EnsureMenusAsync(now, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        if (await dbContext.Users.IgnoreQueryFilters().AnyAsync(cancellationToken))
        {
            return;
        }

        var section = configuration.GetSection(SectionName);
        var email = EmailRules.Normalize(section["Email"]);
        var password = section["Password"] ?? string.Empty;
        var name = TextFormat.Title(section["Name"] ?? "Administrator Sistem");
        var department = string.IsNullOrWhiteSpace(section["Department"])
            ? null
            : section["Department"]!.Trim();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogWarning(
                "Belum ada pengguna di database dan {Section} belum diisi, jadi akun administrator pertama belum dibuat.",
                SectionName
            );

            return;
        }

        if (!EmailRules.IsValid(email) ||
            !PasswordRules.IsValid(password))
        {
            logger.LogError(
                "Akun administrator pertama tidak dibuat: email atau password tidak memenuhi aturan portal."
            );

            return;
        }

        var admin = new User
        {
            Name = name,
            Email = email,
            PasswordHash = passwordHasher.Hash(password),
            Department = department,
            DepartemenCode = Departments.CodeOf(department),
            JobTitle = TextFormat.TitleOrNull(section["JobTitle"]),
            EmployeeNumber = string.IsNullOrWhiteSpace(section["EmployeeNumber"])
                ? null
                : section["EmployeeNumber"]!.Trim(),
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.Users.Add(admin);
        await dbContext.SaveChangesAsync(cancellationToken);

        await EnsureAdministratorGroupAsync(admin, now, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Akun administrator pertama dibuat dengan email {Email}. Segera ganti passwordnya setelah login.",
            email
        );
    }

    private async Task EnsureMenusAsync(
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var existingTargets = await dbContext.PortalMenus
            .IgnoreQueryFilters()
            .Where(x => x.TargetType == PortalMenuTargetTypes.Page)
            .Select(x => x.TargetValue)
            .ToListAsync(cancellationToken);

        var sections = await EnsureSectionsAsync(now, cancellationToken);

        foreach (var menu in PortalMenuDefaults.All)
        {
            if (existingTargets.Contains(menu.TargetValue))
            {
                continue;
            }

            dbContext.PortalMenus.Add(new PortalMenu
            {
                ParentId = menu.SectionKey is null
                    ? null
                    : sections[menu.SectionKey],
                Label = menu.Label,
                Icon = menu.Icon,
                TargetType = PortalMenuTargetTypes.Page,
                TargetValue = menu.TargetValue,
                SortOrder = menu.SortOrder,
                IsSystem = menu.IsSystem,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            });
        }
    }

    private async Task<Dictionary<string, long>> EnsureSectionsAsync(
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var sections = (await dbContext.PortalMenus
                .IgnoreQueryFilters()
                .Where(x => x.TargetType == PortalMenuTargetTypes.Section)
                .ToListAsync(cancellationToken))
            .GroupBy(x => x.Label)
            .ToDictionary(
                group => group.Key,
                group => group
                    .OrderBy(x => x.DeletedAt is null ? 0 : 1)
                    .ThenBy(x => x.Id)
                    .First()
            );

        var map = new Dictionary<string, long>();

        foreach (var section in PortalMenuDefaults.Sections)
        {
            if (sections.TryGetValue(section.Label, out var existing))
            {
                map[section.TargetValue] = existing.Id;
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

    private async Task EnsureAdministratorGroupAsync(
        User admin,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var group = await dbContext.UserGroups
            .Include(x => x.Members)
            .Include(x => x.MenuAccesses)
            .SingleOrDefaultAsync(
                x => x.Name == AdministratorGroupName,
                cancellationToken
            );

        if (group is null)
        {
            group = new UserGroup
            {
                Name = AdministratorGroupName,
                Description = AdministratorGroupDescription,
                Department = admin.Department,
                DepartemenCode = admin.DepartemenCode,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            dbContext.UserGroups.Add(group);
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
