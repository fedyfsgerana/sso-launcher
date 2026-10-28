using System.Net.Http.Json;
using System.Web;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Domain.Entities;
using SsoLauncher.Infrastructure.Persistence;

namespace SsoLauncher.Api.Tests.Infrastructure;

public sealed record TestApplication(
    long Id,
    string Name,
    string Slug,
    string LaunchUrl
);

public sealed record TestCredential(
    long Id,
    string ClientId,
    string ClientSecret
);

public sealed record TestUser(
    long Id,
    string Email,
    string Password
);

public sealed class TestData(PortalApiFactory factory)
{
    public const string FullScope = "sso.validate users.read";

    public Task<TestApplication> CreateApplicationAsync(
        bool usesSso = true,
        bool grantToAdministrator = true)
    {
        var suffix = NewSuffix();
        var slug = $"uji-{suffix}";
        var launchUrl = $"https://{slug}.example.test/sso/callback";

        return factory.WithDbAsync(async (dbContext, _) =>
        {
            var now = DateTimeOffset.UtcNow;
            var application = new Domain.Entities.Application
            {
                Name = $"Aplikasi Uji {suffix}",
                Slug = slug,
                Description = "Aplikasi untuk pengujian otomatis",
                LaunchUrl = launchUrl,
                Status = "active",
                IsActive = true,
                UsesSso = usesSso,
                CreatedAt = now,
                UpdatedAt = now
            };

            dbContext.Applications.Add(application);
            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

            if (grantToAdministrator)
            {
                var groupId = await AdministratorGroupIdAsync(dbContext);

                dbContext.UserGroupApplicationAccesses.Add(new UserGroupApplicationAccess
                {
                    UserGroupId = groupId,
                    ApplicationId = application.Id,
                    CreatedAt = now,
                    UpdatedAt = now
                });

                await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
            }

            return new TestApplication(
                application.Id,
                application.Name,
                application.Slug,
                application.LaunchUrl
            );
        });
    }

    public Task<TestCredential> AddCredentialAsync(
        long applicationId,
        string scope = FullScope)
    {
        var clientId = $"sso_{Guid.NewGuid():N}";
        var clientSecret = Convert.ToBase64String(Guid.NewGuid().ToByteArray());

        return factory.WithDbAsync(async (dbContext, services) =>
        {
            var passwordHasher = services.GetRequiredService<IPasswordHasher>();
            var now = DateTimeOffset.UtcNow;
            var credential = new ApplicationServiceCredential
            {
                ApplicationId = applicationId,
                ClientId = clientId,
                SecretHash = passwordHasher.Hash(clientSecret),
                Scope = scope,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            dbContext.ApplicationServiceCredentials.Add(credential);
            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

            return new TestCredential(credential.Id, clientId, clientSecret);
        });
    }

    public Task RevokeCredentialAsync(long credentialId)
    {
        return factory.WithDbAsync(async (dbContext, _) =>
        {
            var credential = await dbContext.ApplicationServiceCredentials
                .SingleAsync(
                    x => x.Id == credentialId,
                    TestContext.Current.CancellationToken
                );

            credential.IsActive = false;
            credential.UpdatedAt = DateTimeOffset.UtcNow;

            return await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        });
    }

    public Task<TestUser> CreateMemberAsync(long applicationId)
    {
        var suffix = NewSuffix();
        var email = $"uji_{suffix}@example.test";
        var password = $"Uji#{suffix}9";

        return factory.WithDbAsync(async (dbContext, services) =>
        {
            var passwordHasher = services.GetRequiredService<IPasswordHasher>();
            var now = DateTimeOffset.UtcNow;

            var user = new User
            {
                Name = $"Pengguna Uji {suffix}",
                Email = email,
                PasswordHash = passwordHasher.Hash(password),
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            var group = new UserGroup
            {
                Name = $"Grup Uji {suffix}",
                Description = "Grup untuk pengujian otomatis",
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            dbContext.Users.Add(user);
            dbContext.UserGroups.Add(group);
            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

            dbContext.UserGroupMembers.Add(new UserGroupMember
            {
                UserGroupId = group.Id,
                UserId = user.Id,
                CreatedAt = now
            });

            dbContext.UserGroupApplicationAccesses.Add(new UserGroupApplicationAccess
            {
                UserGroupId = group.Id,
                ApplicationId = applicationId,
                CreatedAt = now,
                UpdatedAt = now
            });

            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

            return new TestUser(user.Id, email, password);
        });
    }

    public Task<TestUser> CreateUserAsync(
        bool isActive = true,
        string? departemenCode = null)
    {
        var suffix = NewSuffix();
        var email = $"uji_{suffix}@example.test";
        var password = $"Uji#{suffix}9";

        return factory.WithDbAsync(async (dbContext, services) =>
        {
            var passwordHasher = services.GetRequiredService<IPasswordHasher>();
            var now = DateTimeOffset.UtcNow;
            var user = new User
            {
                Name = $"Pengguna Uji {suffix}",
                Email = email,
                PasswordHash = passwordHasher.Hash(password),
                IsActive = isActive,
                DepartemenCode = departemenCode,
                Department = departemenCode,
                CreatedAt = now,
                UpdatedAt = now
            };

            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

            return new TestUser(user.Id, email, password);
        });
    }

    public Task<long> CreateGroupAsync(string? departemenCode = null)
    {
        var suffix = NewSuffix();

        return factory.WithDbAsync(async (dbContext, _) =>
        {
            var now = DateTimeOffset.UtcNow;
            var group = new UserGroup
            {
                Name = $"Grup Uji {suffix}",
                Description = "Grup untuk pengujian otomatis",
                DepartemenCode = departemenCode,
                Department = departemenCode,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            dbContext.UserGroups.Add(group);
            await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

            return group.Id;
        });
    }

    public Task<bool> IsMemberAsync(long groupId, long userId)
    {
        return factory.WithDbAsync((dbContext, _) =>
            dbContext.UserGroupMembers.AnyAsync(
                x => x.UserGroupId == groupId && x.UserId == userId,
                TestContext.Current.CancellationToken
            )
        );
    }

    public Task AgeSessionsAsync(long userId, TimeSpan idle)
    {
        return factory.WithDbAsync(async (dbContext, _) =>
        {
            var lastSeenAt = DateTimeOffset.UtcNow - idle;
            var sessions = await dbContext.RefreshTokens
                .Where(x => x.UserId == userId)
                .ToListAsync(TestContext.Current.CancellationToken);

            foreach (var session in sessions)
            {
                session.LastSeenAt = lastSeenAt;
            }

            return await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        });
    }

    public Task<bool> HasSessionAuditAsync(string email, string action)
    {
        return factory.WithDbAsync((dbContext, _) =>
            dbContext.AuditLogs.AnyAsync(
                x => x.TargetName == email && x.Action == action,
                TestContext.Current.CancellationToken
            )
        );
    }

    public Task DeactivateUserAsync(long userId)
    {
        return factory.WithDbAsync(async (dbContext, _) =>
        {
            var user = await dbContext.Users
                .SingleAsync(
                    x => x.Id == userId,
                    TestContext.Current.CancellationToken
                );

            user.IsActive = false;
            user.UpdatedAt = DateTimeOffset.UtcNow;

            return await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        });
    }

    public Task RevokeAdministratorAccessAsync(long applicationId)
    {
        return factory.WithDbAsync(async (dbContext, _) =>
        {
            var groupId = await AdministratorGroupIdAsync(dbContext);

            var access = await dbContext.UserGroupApplicationAccesses
                .SingleAsync(
                    x => x.UserGroupId == groupId && x.ApplicationId == applicationId,
                    TestContext.Current.CancellationToken
                );

            dbContext.UserGroupApplicationAccesses.Remove(access);

            return await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        });
    }

    public Task<long> AdministratorIdAsync()
    {
        return factory.WithDbAsync((dbContext, _) =>
            dbContext.Users
                .Where(x => x.Email == PortalApiFactory.AdministratorEmail)
                .Select(x => x.Id)
                .SingleAsync(TestContext.Current.CancellationToken)
        );
    }

    public async Task<string> LaunchTokenAsync(
        PortalSession session,
        long applicationId)
    {
        var response = await session.PostAsync(
            "/api/sso/launch",
            new { applicationId }
        );

        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<LaunchBody>(
            TestContext.Current.CancellationToken
        );

        var query = HttpUtility.ParseQueryString(new Uri(body!.LaunchUrl).Query);

        return query["sso_token"]
            ?? throw new InvalidOperationException("URL peluncuran tidak berisi sso_token.");
    }

    public Task<bool> HasAuditAsync(
        long applicationId,
        string outcome,
        string summaryPart)
    {
        return factory.WithDbAsync((dbContext, _) =>
            dbContext.AuditLogs.AnyAsync(
                x =>
                    x.TargetId == applicationId &&
                    x.Outcome == outcome &&
                    x.Summary.Contains(summaryPart),
                TestContext.Current.CancellationToken
            )
        );
    }

    private static Task<long> AdministratorGroupIdAsync(
        SsoLauncherDbContext dbContext)
    {
        return dbContext.UserGroups
            .Where(x => x.Name == PortalApiFactory.AdministratorGroupName)
            .Select(x => x.Id)
            .SingleAsync(TestContext.Current.CancellationToken);
    }

    private static string NewSuffix()
    {
        return Guid.NewGuid().ToString("N")[..10];
    }

    private sealed record LaunchBody(
        string LaunchUrl
    );
}
