#nullable enable

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Users;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Seed;

public sealed class LoadTestSeeder(
    SsoLauncherDbContext dbContext,
    IPasswordHasher passwordHasher,
    ILogger<LoadTestSeeder> logger)
{
    public const int UserCount = 20_000;
    public const int GroupCount = 500;
    public const int AuditLogCount = 100_000;

    private const string NamePrefix = "Uji";
    private const string EmployeePrefix = "99";
    private const string GroupPrefix = "Grup Uji";
    private const string AuditPrefix = "[uji]";
    private const string Password = "p@ssw0rd123!";
    private const int BatchSize = 2_000;

    private static readonly string[] FirstNames =
    [
        "Adi", "Budi", "Citra", "Dewi", "Eka", "Fajar", "Gita", "Hadi", "Indah",
        "Joko", "Kartika", "Lestari", "Maya", "Nanda", "Oka", "Putri", "Rizki",
        "Sari", "Tono", "Umar", "Vina", "Wati", "Yudi", "Zahra"
    ];

    private static readonly string[] JobTitles =
    [
        "Staf", "Staf", "Staf", "Operator", "Operator", "Operator", "Admin",
        "Supervisor", "Kepala Bagian", "Manajer"
    ];

    private static readonly string[] GroupDescriptions =
    [
        "Grup akses untuk karyawan satu departemen",
        "Grup akses untuk karyawan dengan jabatan yang sama",
        "Grup akses untuk staf operasional dan lapangan",
        "Grup akses untuk staf administrasi dan kantor",
        "Grup akses untuk supervisor dan kepala bagian",
        "Grup akses untuk manajer dan pimpinan departemen"
    ];

    private static readonly string[] LastNames =
    [
        "Pratama", "Saputra", "Wijaya", "Lestari", "Hidayat", "Nugroho", "Santoso",
        "Kusuma", "Permata", "Siregar", "Harahap", "Simanjuntak", "Tanjung",
        "Rahman", "Syahputra", "Utami"
    ];

    private static readonly string[] Actions =
    [
        AuditActions.Create,
        AuditActions.Update,
        AuditActions.Delete,
        AuditActions.Login,
        AuditActions.Logout,
        AuditActions.Launch,
        AuditActions.Grant,
        AuditActions.Revoke
    ];

    private static readonly string[] Targets =
    [
        AuditTargets.User,
        AuditTargets.UserGroup,
        AuditTargets.Application,
        AuditTargets.Session
    ];

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        dbContext.ChangeTracker.AutoDetectChangesEnabled = false;

        var random = new Random(20260930);
        var now = DateTimeOffset.UtcNow;

        await SeedUsersAsync(random, now, cancellationToken);
        await SeedGroupsAsync(random, now, cancellationToken);
        await SeedAuditLogsAsync(random, now, cancellationToken);

        dbContext.ChangeTracker.AutoDetectChangesEnabled = true;
    }

    public async Task ClearAsync(CancellationToken cancellationToken = default)
    {
        var audit = await dbContext.AuditLogs
            .Where(x => x.Summary.StartsWith(AuditPrefix))
            .ExecuteDeleteAsync(cancellationToken);

        var groupIds = dbContext.UserGroups
            .IgnoreQueryFilters()
            .Where(x => x.Name.StartsWith(GroupPrefix))
            .Select(x => x.Id);
        var userIds = dbContext.Users
            .IgnoreQueryFilters()
            .Where(x =>
                x.Name.StartsWith(NamePrefix + " ") &&
                x.EmployeeNumber != null &&
                x.EmployeeNumber.StartsWith(EmployeePrefix))
            .Select(x => x.Id);

        await dbContext.UserGroupMembers
            .IgnoreQueryFilters()
            .Where(x => groupIds.Contains(x.UserGroupId) || userIds.Contains(x.UserId))
            .ExecuteDeleteAsync(cancellationToken);

        var groups = await dbContext.UserGroups
            .IgnoreQueryFilters()
            .Where(x => x.Name.StartsWith(GroupPrefix))
            .ExecuteDeleteAsync(cancellationToken);

        var users = await dbContext.Users
            .IgnoreQueryFilters()
            .Where(x =>
                x.Name.StartsWith(NamePrefix + " ") &&
                x.EmployeeNumber != null &&
                x.EmployeeNumber.StartsWith(EmployeePrefix))
            .ExecuteDeleteAsync(cancellationToken);

        logger.LogInformation(
            "Data uji beban dihapus: {Users} pengguna, {Groups} grup, {Audit} riwayat aktivitas.",
            users,
            groups,
            audit
        );
    }

    private async Task SeedUsersAsync(
        Random random,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var existing = await dbContext.Users
            .CountAsync(
                x => x.Name.StartsWith(NamePrefix + " ") &&
                     x.EmployeeNumber != null &&
                     x.EmployeeNumber.StartsWith(EmployeePrefix),
                cancellationToken
            );

        if (existing >= UserCount)
        {
            logger.LogInformation("Pengguna uji sudah ada ({Count}), dilewati.", existing);
            return;
        }

        var hash = passwordHasher.Hash(Password);
        var batch = new List<User>(BatchSize);

        for (var index = existing; index < UserCount; index++)
        {
            var first = FirstNames[random.Next(FirstNames.Length)];
            var last = LastNames[random.Next(LastNames.Length)];
            var departmentDefinition = Departments.All[random.Next(Departments.All.Count)];
            var department = departmentDefinition.Name;
            var employeeNumber = $"{EmployeePrefix}{index + 1:D7}";
            var name = $"{NamePrefix} {first} {last} {index + 1}";
            var created = now.AddDays(-random.Next(0, 720));

            batch.Add(new User
            {
                Name = name,
                Email = $"{first}.{last}.{index + 1}@uji.example.test".ToLowerInvariant(),
                PasswordHash = hash,
                EmployeeNumber = employeeNumber,
                Department = department,
                DepartemenCode = departmentDefinition.Code,
                JobTitle = JobTitles[random.Next(JobTitles.Length)],
                IsActive = random.Next(10) != 0,
                CreatedAt = created,
                UpdatedAt = created
            });

            if (batch.Count == BatchSize)
            {
                await FlushAsync(batch, cancellationToken);
                logger.LogInformation("Pengguna uji: {Count}/{Total}", index + 1, UserCount);
            }
        }

        await FlushAsync(batch, cancellationToken);
    }

    private async Task SeedGroupsAsync(
        Random random,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var existing = await dbContext.UserGroups
            .CountAsync(x => x.Name.StartsWith(GroupPrefix), cancellationToken);

        if (existing >= GroupCount)
        {
            logger.LogInformation("Grup uji sudah ada ({Count}), dilewati.", existing);
            return;
        }

        var usersByDepartment = (await dbContext.Users
                .AsNoTracking()
                .Where(x =>
                    x.Name.StartsWith(NamePrefix + " ") &&
                    x.EmployeeNumber != null &&
                    x.EmployeeNumber.StartsWith(EmployeePrefix))
                .Select(x => new { x.Id, x.DepartemenCode })
                .ToListAsync(cancellationToken))
            .GroupBy(x => x.DepartemenCode ?? string.Empty)
            .ToDictionary(group => group.Key, group => group.Select(x => x.Id).ToArray());

        var menuIds = await dbContext.PortalMenus
            .AsNoTracking()
            .Where(x => x.TargetType != PortalMenuTargetTypes.Section)
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        var applicationIds = await dbContext.Applications
            .AsNoTracking()
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        for (var index = existing; index < GroupCount; index++)
        {
            var groupDepartment = Departments.All[index % Departments.All.Count];
            var department = groupDepartment.Name;
            var group = new UserGroup
            {
                Name = $"{GroupPrefix} {index + 1:D3}",
                Description = GroupDescriptions[index % GroupDescriptions.Length],
                Department = department,
                DepartemenCode = groupDepartment.Code,
                IsActive = random.Next(8) != 0,
                CreatedAt = now,
                UpdatedAt = now
            };

            if (usersByDepartment.TryGetValue(groupDepartment.Code, out var candidates))
            {
                foreach (var userId in candidates
                             .OrderBy(_ => random.Next())
                             .Take(random.Next(10, 80)))
                {
                    group.Members.Add(new UserGroupMember { UserId = userId, CreatedAt = now });
                }
            }

            foreach (var menuId in menuIds.OrderBy(_ => random.Next()).Take(random.Next(1, 5)))
            {
                group.MenuAccesses.Add(new UserGroupMenuAccess { PortalMenuId = menuId, CreatedAt = now });
            }

            foreach (var applicationId in applicationIds
                         .OrderBy(_ => random.Next())
                         .Take(random.Next(0, 6)))
            {
                group.Accesses.Add(new UserGroupApplicationAccess
                {
                    ApplicationId = applicationId,
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }

            dbContext.UserGroups.Add(group);

            if ((index + 1) % 100 == 0)
            {
                await dbContext.SaveChangesAsync(cancellationToken);
                dbContext.ChangeTracker.Clear();
                logger.LogInformation("Grup uji: {Count}/{Total}", index + 1, GroupCount);
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        dbContext.ChangeTracker.Clear();
    }

    private async Task SeedAuditLogsAsync(
        Random random,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var existing = await dbContext.AuditLogs
            .CountAsync(x => x.Summary.StartsWith(AuditPrefix), cancellationToken);

        if (existing >= AuditLogCount)
        {
            logger.LogInformation("Riwayat uji sudah ada ({Count}), dilewati.", existing);
            return;
        }

        var actors = await dbContext.Users
            .AsNoTracking()
            .OrderBy(x => x.Id)
            .Take(500)
            .Select(x => new { x.Id, x.Name })
            .ToListAsync(cancellationToken);

        var batch = new List<AuditLog>(BatchSize);

        for (var index = existing; index < AuditLogCount; index++)
        {
            var actor = actors[random.Next(actors.Count)];
            var action = Actions[random.Next(Actions.Length)];
            var target = Targets[random.Next(Targets.Length)];

            batch.Add(new AuditLog
            {
                ActorId = actor.Id,
                ActorName = actor.Name,
                Action = action,
                Outcome = random.Next(20) == 0 ? AuditOutcomes.Failed : AuditOutcomes.Success,
                TargetType = target,
                TargetId = random.Next(1, 20_000),
                TargetName = $"Data uji {random.Next(1, 5_000)}",
                Summary = $"{AuditPrefix} {action} {target}",
                IpAddress = $"192.168.{random.Next(1, 20)}.{random.Next(2, 254)}",
                Browser = "Chrome",
                OperatingSystem = "Windows",
                DeviceType = "desktop",
                OccurredAt = now.AddMinutes(-random.Next(0, 60 * 24 * 365))
            });

            if (batch.Count == BatchSize)
            {
                await FlushAsync(batch, cancellationToken);
                logger.LogInformation("Riwayat uji: {Count}/{Total}", index + 1, AuditLogCount);
            }
        }

        await FlushAsync(batch, cancellationToken);
    }

    private async Task FlushAsync<T>(List<T> batch, CancellationToken cancellationToken)
        where T : class
    {
        if (batch.Count == 0)
        {
            return;
        }

        dbContext.Set<T>().AddRange(batch);
        await dbContext.SaveChangesAsync(cancellationToken);
        dbContext.ChangeTracker.Clear();
        batch.Clear();
    }
}
