using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Configurations;

public sealed class NotificationConfiguration :
    IEntityTypeConfiguration<Notification>
{
    public void Configure(
        EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("portal_notifications");

        builder.HasKey(x => x.Id)
            .HasName("pk_portal_notifications");

        builder.Property(x => x.Id)
            .HasColumnName("portal_notifications_id")
            .UseIdentityByDefaultColumn();

        builder.Property(x => x.UserId)
            .HasColumnName("mgmt_users_id")
            .IsRequired();

        builder.Property(x => x.Kind)
            .HasColumnName("kind")
            .HasMaxLength(40)
            .IsRequired();

        builder.Property(x => x.Title)
            .HasColumnName("title")
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.Body)
            .HasColumnName("body")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.Link)
            .HasColumnName("link")
            .HasMaxLength(300);

        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(x => x.ReadAt)
            .HasColumnName("read_at");

        builder.HasIndex(x => new
        {
            x.UserId,
            x.CreatedAt
        })
            .HasDatabaseName("ix_portal_notifications_user_created_at")
            .IsDescending(false, true);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .HasConstraintName("fk_portal_notifications_mgmt_users")
            .OnDelete(DeleteBehavior.Cascade);
    }
}