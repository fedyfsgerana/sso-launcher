using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Configurations;

public sealed class PortalMenuConfiguration :
    IEntityTypeConfiguration<PortalMenu>
{
    public void Configure(
        EntityTypeBuilder<PortalMenu> builder)
    {
        builder.ToTable("mgmt_portal_menus");

        builder.HasKey(x => x.Id)
            .HasName("pk_mgmt_portal_menus");

        builder.Property(x => x.Id)
            .HasColumnName("mgmt_portal_menus_id")
            .UseIdentityByDefaultColumn();

        builder.Property(x => x.ParentId)
            .HasColumnName("parent_id");

        builder.Property(x => x.Label)
            .HasColumnName("label")
            .HasMaxLength(60)
            .IsRequired();

        builder.Property(x => x.Icon)
            .HasColumnName("icon")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.TargetType)
            .HasColumnName("target_type")
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.TargetValue)
            .HasColumnName("target_value")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.SortOrder)
            .HasColumnName("sort_order")
            .IsRequired();

        builder.Property(x => x.IsSystem)
            .HasColumnName("is_system")
            .IsRequired();

        builder.Property(x => x.IsActive)
            .HasColumnName("is_active")
            .IsRequired();

        builder.Property(x => x.MaintenanceActive)
            .HasColumnName("maintenance_active")
            .HasDefaultValue(false);

        builder.Property(x => x.MaintenanceTitle)
            .HasColumnName("maintenance_title")
            .HasMaxLength(120);

        builder.Property(x => x.MaintenanceMessage)
            .HasColumnName("maintenance_message")
            .HasMaxLength(500);

        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.HasIndex(x => new
        {
            x.ParentId,
            x.SortOrder
        })
            .HasDatabaseName("ix_mgmt_portal_menus_parent_sort_order");

        builder.HasOne(x => x.Parent)
            .WithMany(x => x.Children)
            .HasForeignKey(x => x.ParentId)
            .HasConstraintName("fk_mgmt_portal_menus_parent")
            .OnDelete(DeleteBehavior.Restrict);
    }
}
