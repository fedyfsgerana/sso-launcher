using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.Abstractions.Persistence;

public interface ISsoLauncherDbContext
{
    DbSet<User> Users { get; }

    DbSet<SsoLauncher.Domain.Entities.Application> Applications { get; }

    DbSet<ApplicationFavorite> ApplicationFavorites { get; }



    DbSet<ApplicationServiceCredential> ApplicationServiceCredentials { get; }

    DbSet<PortalActivity> PortalActivities { get; }

    DbSet<PortalMenu> PortalMenus { get; }

    DbSet<UserGroup> UserGroups { get; }

    DbSet<UserGroupMember> UserGroupMembers { get; }

    DbSet<UserGroupApplicationAccess> UserGroupApplicationAccesses { get; }

    DbSet<UserGroupMenuAccess> UserGroupMenuAccesses { get; }

    DbSet<UserGroupMenuAction> UserGroupMenuActions { get; }

    DbSet<AuditLog> AuditLogs { get; }

    DbSet<DataVersion> DataVersions { get; }

    DbSet<RefreshToken> RefreshTokens { get; }

    DbSet<LoginFailure> LoginFailures { get; }

    DbSet<Notification> Notifications { get; }

    DbSet<NotificationSetting> NotificationSettings { get; }

    DatabaseFacade Database { get; }

    Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default);
}
