using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Configurations;

public sealed class PortalActivityConfiguration :
    IEntityTypeConfiguration<PortalActivity>
{
    public void Configure(
        EntityTypeBuilder<PortalActivity> builder)
    {
        builder.ToTable("portal_activities");

        builder.HasKey(x => x.Id)
            .HasName("pk_portal_activities");

        builder.Property(x => x.Id)
            .HasColumnName("portal_activities_id")
            .UseIdentityByDefaultColumn();

        builder.Property(x => x.UserId)
            .HasColumnName("mgmt_users_id")
            .IsRequired();

        builder.Property(x => x.ApplicationId)
            .HasColumnName("mgmt_applications_id");

        builder.Property(x => x.Kind)
            .HasColumnName("kind")
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.Title)
            .HasColumnName("title")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.Subtitle)
            .HasColumnName("subtitle")
            .HasMaxLength(200)
            .HasDefaultValue(string.Empty)
            .IsRequired();

        builder.Property(x => x.TargetPath)
            .HasColumnName("target_path")
            .HasMaxLength(500);

        builder.Property(x => x.OccurredAt)
            .HasColumnName("occurred_at")
            .IsRequired();

        builder.HasIndex(x => new
        {
            x.UserId,
            x.OccurredAt
        })
            .HasDatabaseName("ix_portal_activities_user_occurred_at")
            .IsDescending(false, true);

        builder.HasIndex(x => x.ApplicationId)
            .HasDatabaseName("ix_portal_activities_mgmt_applications_id");

        builder.HasOne(x => x.User)
            .WithMany(x => x.Activities)
            .HasForeignKey(x => x.UserId)
            .HasConstraintName("fk_portal_activities_mgmt_users")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Application)
            .WithMany()
            .HasForeignKey(x => x.ApplicationId)
            .HasConstraintName("fk_portal_activities_mgmt_applications")
            .OnDelete(DeleteBehavior.Cascade);
    }
}
