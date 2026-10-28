using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence;

public sealed class SsoLauncherDbContext :
    DbContext,
    ISsoLauncherDbContext
{
    private const string SoftDeleteFilter = "deleted_at IS NULL";

    private readonly AuditScope auditScope;

    public SsoLauncherDbContext(
        DbContextOptions<SsoLauncherDbContext> options,
        AuditScope auditScope)
        : base(options)
    {
        this.auditScope = auditScope;

        ChangeTracker.CascadeDeleteTiming = CascadeTiming.Never;
    }

    public DbSet<User> Users =>
        Set<User>();

    public DbSet<SsoLauncher.Domain.Entities.Application> Applications =>
        Set<SsoLauncher.Domain.Entities.Application>();

    public DbSet<ApplicationFavorite> ApplicationFavorites =>
        Set<ApplicationFavorite>();

    public DbSet<ApplicationServiceCredential> ApplicationServiceCredentials =>
        Set<ApplicationServiceCredential>();

    public DbSet<PortalActivity> PortalActivities =>
        Set<PortalActivity>();

    public DbSet<PortalMenu> PortalMenus =>
        Set<PortalMenu>();

    public DbSet<UserGroup> UserGroups =>
        Set<UserGroup>();

    public DbSet<UserGroupMember> UserGroupMembers =>
        Set<UserGroupMember>();

    public DbSet<UserGroupApplicationAccess> UserGroupApplicationAccesses =>
        Set<UserGroupApplicationAccess>();

    public DbSet<UserGroupMenuAction> UserGroupMenuActions =>
        Set<UserGroupMenuAction>();

    public DbSet<UserGroupMenuAccess> UserGroupMenuAccesses =>
        Set<UserGroupMenuAccess>();

    public DbSet<AuditLog> AuditLogs =>
        Set<AuditLog>();

    public DbSet<DataVersion> DataVersions =>
        Set<DataVersion>();

    public DbSet<RefreshToken> RefreshTokens =>
        Set<RefreshToken>();

    public DbSet<LoginFailure> LoginFailures =>
        Set<LoginFailure>();

    public DbSet<Notification> Notifications =>
        Set<Notification>();

    public DbSet<NotificationSetting> NotificationSettings =>
        Set<NotificationSetting>();

    public override int SaveChanges(
        bool acceptAllChangesOnSuccess)
    {
        ApplySoftDelete();

        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        ApplySoftDelete();

        return base.SaveChangesAsync(
            acceptAllChangesOnSuccess,
            cancellationToken
        );
    }

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(SsoLauncherDbContext).Assembly
        );

        ConfigureSoftDeleteColumns(modelBuilder);

        ApplySoftDeleteFilters(modelBuilder);

        base.OnModelCreating(modelBuilder);
    }

    private void ApplySoftDelete()
    {
        var now = DateTimeOffset.UtcNow;

        foreach (var entry in ChangeTracker
                     .Entries<ISoftDeletable>()
                     .ToList())
        {
            if (entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                entry.Entity.DeletedAt ??= now;
                StampDeletion(entry.Entity);
                continue;
            }

            if (entry.State != EntityState.Modified)
            {
                continue;
            }

            var deletedAt = entry.Property(
                nameof(ISoftDeletable.DeletedAt)
            );

            if (!deletedAt.IsModified)
            {
                continue;
            }

            if (entry.Entity.DeletedAt is null)
            {
                ClearDeletion(entry);
                continue;
            }

            if (deletedAt.OriginalValue is null)
            {
                StampDeletion(entry.Entity);
            }
        }
    }

    private void StampDeletion(ISoftDeletable entity)
    {
        entity.DeletedById ??= auditScope.ActorId;

        if (string.IsNullOrWhiteSpace(entity.DeletedByName) &&
            !string.IsNullOrWhiteSpace(auditScope.ActorName))
        {
            entity.DeletedByName = Limit(auditScope.ActorName, 150);
        }

        if (string.IsNullOrWhiteSpace(entity.DeleteReason) &&
            auditScope.DeleteReason is not null)
        {
            entity.DeleteReason = Limit(auditScope.DeleteReason, 500);
        }
    }

    private static void ClearDeletion(
        EntityEntry<ISoftDeletable> entry)
    {
        entry.Entity.DeletedById = null;
        entry.Entity.DeletedByName = null;
        entry.Entity.DeleteReason = null;
    }

    private static string Limit(string value, int length)
    {
        return value.Length <= length
            ? value
            : value[..length];
    }

    private static void ConfigureSoftDeleteColumns(
        ModelBuilder modelBuilder)
    {
        var entityTypes = modelBuilder.Model
            .GetEntityTypes()
            .Where(x => typeof(ISoftDeletable).IsAssignableFrom(x.ClrType))
            .ToList();

        foreach (var entityType in entityTypes)
        {
            foreach (var index in entityType.GetIndexes().ToList())
            {
                if (index.IsUnique &&
                    string.IsNullOrWhiteSpace(index.GetFilter()))
                {
                    index.SetFilter(SoftDeleteFilter);
                }
            }

            var tableName =
                entityType.GetTableName() ?? entityType.ClrType.Name;

            var entity = modelBuilder.Entity(entityType.ClrType);

            entity.Property(nameof(ISoftDeletable.DeletedAt))
                .HasColumnName("deleted_at");

            entity.Property(nameof(ISoftDeletable.DeletedById))
                .HasColumnName("deleted_by_id");

            entity.Property(nameof(ISoftDeletable.DeletedByName))
                .HasColumnName("deleted_by_name")
                .HasMaxLength(150);

            entity.Property(nameof(ISoftDeletable.DeleteReason))
                .HasColumnName("delete_reason")
                .HasMaxLength(500);

            entity.HasIndex(nameof(ISoftDeletable.DeletedAt))
                .HasDatabaseName($"ix_{tableName}_deleted_at");
        }
    }

    private static void ApplySoftDeleteFilters(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ApplicationFavorite>()
            .HasQueryFilter(x =>
                x.DeletedAt == null &&
                x.User.DeletedAt == null &&
                x.Application.DeletedAt == null);

        modelBuilder.Entity<ApplicationServiceCredential>()
            .HasQueryFilter(x =>
                x.DeletedAt == null &&
                x.Application.DeletedAt == null);

        modelBuilder.Entity<PortalActivity>()
            .HasQueryFilter(x =>
                x.DeletedAt == null &&
                x.User.DeletedAt == null);

        modelBuilder.Entity<Notification>()
            .HasQueryFilter(x => x.User.DeletedAt == null);

        modelBuilder.Entity<NotificationSetting>()
            .HasQueryFilter(x => x.User.DeletedAt == null);

        modelBuilder.Entity<PortalMenu>()
            .HasQueryFilter(x => x.DeletedAt == null);

        modelBuilder.Entity<RefreshToken>()
            .HasQueryFilter(x => x.User.DeletedAt == null);

        modelBuilder.Entity<UserGroup>()
            .HasQueryFilter(x => x.DeletedAt == null);

        modelBuilder.Entity<UserGroupApplicationAccess>()
            .HasQueryFilter(x =>
                x.DeletedAt == null &&
                x.UserGroup.DeletedAt == null &&
                x.Application.DeletedAt == null);

        modelBuilder.Entity<UserGroupMember>()
            .HasQueryFilter(x =>
                x.DeletedAt == null &&
                x.UserGroup.DeletedAt == null &&
                x.User.DeletedAt == null);

        modelBuilder.Entity<UserGroupMenuAccess>()
            .HasQueryFilter(x =>
                x.DeletedAt == null &&
                x.UserGroup.DeletedAt == null &&
                x.PortalMenu.DeletedAt == null);

        modelBuilder.Entity<UserGroupMenuAction>()
            .HasQueryFilter(x =>
                x.UserGroup.DeletedAt == null &&
                x.PortalMenu.DeletedAt == null);
    }
}
