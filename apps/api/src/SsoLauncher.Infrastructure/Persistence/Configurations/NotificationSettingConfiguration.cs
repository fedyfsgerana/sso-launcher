using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Configurations;

public sealed class NotificationSettingConfiguration :
    IEntityTypeConfiguration<NotificationSetting>
{
    public void Configure(
        EntityTypeBuilder<NotificationSetting> builder)
    {
        builder.ToTable("portal_notification_settings");

        builder.HasKey(x => x.Id)
            .HasName("pk_portal_notification_settings");

        builder.Property(x => x.Id)
            .HasColumnName("portal_notification_settings_id")
            .UseIdentityByDefaultColumn();

        builder.Property(x => x.UserId)
            .HasColumnName("mgmt_users_id")
            .IsRequired();

        builder.Property(x => x.AccessChanges)
            .HasColumnName("access_changes")
            .IsRequired();

        builder.Property(x => x.ApplicationStatus)
            .HasColumnName("application_status")
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.HasIndex(x => x.UserId)
            .IsUnique()
            .HasDatabaseName("ux_portal_notification_settings_mgmt_users_id");

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .HasConstraintName("fk_portal_notification_settings_mgmt_users")
            .OnDelete(DeleteBehavior.Cascade);
    }
}