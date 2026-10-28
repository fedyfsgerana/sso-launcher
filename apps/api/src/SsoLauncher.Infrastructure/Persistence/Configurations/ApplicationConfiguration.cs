using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Configurations;

public sealed class ApplicationConfiguration :
    IEntityTypeConfiguration<SsoLauncher.Domain.Entities.Application>
{
    public void Configure(
        EntityTypeBuilder<SsoLauncher.Domain.Entities.Application> builder)
    {
        builder.ToTable("mgmt_applications");

        builder.HasKey(x => x.Id)
            .HasName("pk_mgmt_applications");

        builder.Property(x => x.Id)
            .HasColumnName("mgmt_applications_id")
            .UseIdentityByDefaultColumn();

        builder.Property(x => x.Name)
            .HasColumnName("name")
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.Slug)
            .HasColumnName("slug")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasColumnName("description")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.AppUrl)
            .HasColumnName("app_url")
            .HasMaxLength(500)
            .HasDefaultValue(string.Empty)
            .IsRequired();

        builder.Property(x => x.LaunchUrl)
            .HasColumnName("launch_url")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.Category)
            .HasColumnName("category")
            .HasMaxLength(100)
            .HasDefaultValue(string.Empty)
            .IsRequired();

        builder.Property(x => x.Icon)
            .HasColumnName("icon")
            .HasMaxLength(50)
            .HasDefaultValue("apps")
            .IsRequired();

        builder.Property(x => x.Color)
            .HasColumnName("color")
            .HasMaxLength(50)
            .HasDefaultValue("app-hr")
            .IsRequired();

        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasMaxLength(20)
            .HasDefaultValue("active")
            .IsRequired();

        builder.Property(x => x.MaintenanceMessage)
            .HasColumnName("maintenance_message")
            .HasMaxLength(300)
            .HasDefaultValue(string.Empty)
            .IsRequired();

        builder.Property(x => x.UsesSso)
            .HasColumnName("uses_sso")
            .HasDefaultValue(true)
            .HasSentinel(true)
            .IsRequired();

        builder.Property(x => x.IsActive)
            .HasColumnName("is_active")
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.HasIndex(x => x.Slug)
            .IsUnique()
            .HasDatabaseName("ux_mgmt_applications_slug")
            .HasFilter("deleted_at IS NULL");

        builder.HasIndex(x => x.Status)
            .HasDatabaseName("ix_mgmt_applications_status");

        builder.HasIndex(x => x.Name)
            .HasDatabaseName("ix_mgmt_applications_name")
            .HasFilter("deleted_at IS NULL");

        builder.HasIndex(x => new { x.Category, x.Name })
            .HasDatabaseName("ix_mgmt_applications_category_name")
            .HasFilter("deleted_at IS NULL");

        builder.HasQueryFilter(x => x.DeletedAt == null);
    }
}
