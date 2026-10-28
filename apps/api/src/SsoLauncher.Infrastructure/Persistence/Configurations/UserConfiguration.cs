using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration :
    IEntityTypeConfiguration<User>
{
    public void Configure(
        EntityTypeBuilder<User> builder)
    {
        builder.ToTable("mgmt_users");

        builder.HasKey(x => x.Id)
            .HasName("pk_mgmt_users");

        builder.Property(x => x.Id)
            .HasColumnName("mgmt_users_id")
            .UseIdentityByDefaultColumn();

        builder.Property(x => x.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.Email)
            .HasColumnName("email")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.PasswordHash)
            .HasColumnName("password_hash")
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(x => x.EmployeeNumber)
            .HasColumnName("employee_number")
            .HasMaxLength(50);

        builder.Property(x => x.Department)
            .HasColumnName("department")
            .HasMaxLength(150);

        builder.Property(x => x.DepartemenCode)
            .HasColumnName("departemen_code")
            .HasMaxLength(50);

        builder.Property(x => x.JobTitle)
            .HasColumnName("job_title")
            .HasMaxLength(150);

        builder.Property(x => x.IsActive)
            .HasColumnName("is_active")
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.HasIndex(x => x.Email)
            .IsUnique()
            .HasDatabaseName("ux_mgmt_users_email")
            .HasFilter("deleted_at IS NULL");

        builder.HasIndex(x => x.EmployeeNumber)
            .IsUnique()
            .HasDatabaseName("ux_mgmt_users_employee_number")
            .HasFilter("employee_number IS NOT NULL AND deleted_at IS NULL");

        builder.HasIndex(x => x.DepartemenCode)
            .HasDatabaseName("ix_mgmt_users_departemen_code")
            .HasFilter("deleted_at IS NULL");

        builder.HasIndex(x => x.Name)
            .HasDatabaseName("ix_mgmt_users_name")
            .HasFilter("deleted_at IS NULL");

        builder.HasIndex(x => new { x.Department, x.Name })
            .HasDatabaseName("ix_mgmt_users_department_name")
            .HasFilter("deleted_at IS NULL");

        builder.HasIndex(x => new { x.IsActive, x.Name })
            .HasDatabaseName("ix_mgmt_users_is_active_name")
            .HasFilter("deleted_at IS NULL");

        builder.HasQueryFilter(x => x.DeletedAt == null);
    }
}
