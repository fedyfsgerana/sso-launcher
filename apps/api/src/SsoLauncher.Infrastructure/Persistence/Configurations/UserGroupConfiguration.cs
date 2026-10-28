using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Configurations;

public sealed class UserGroupConfiguration :
    IEntityTypeConfiguration<UserGroup>
{
    public void Configure(
        EntityTypeBuilder<UserGroup> builder)
    {
        builder.ToTable("mgmt_user_groups");

        builder.HasKey(x => x.Id)
            .HasName("pk_mgmt_user_groups");

        builder.Property(x => x.Id)
            .HasColumnName("mgmt_user_groups_id")
            .UseIdentityByDefaultColumn();

        builder.Property(x => x.Name)
            .HasColumnName("name")
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasColumnName("description")
            .HasMaxLength(300)
            .HasDefaultValue(string.Empty)
            .IsRequired();

        builder.Property(x => x.Department)
            .HasColumnName("department")
            .HasMaxLength(100);

        builder.Property(x => x.DepartemenCode)
            .HasColumnName("departemen_code")
            .HasMaxLength(50);

        builder.Property(x => x.IsActive)
            .HasColumnName("is_active")
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.HasIndex(x => new { x.DepartemenCode, x.Name })
            .IsUnique()
            .HasDatabaseName("ux_mgmt_user_groups_departemen_code_name");

        builder.HasIndex(x => new { x.Department, x.Name })
            .HasDatabaseName("ix_mgmt_user_groups_department_name");
    }
}
