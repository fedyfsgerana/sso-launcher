using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Configurations;

public sealed class UserGroupApplicationAccessConfiguration :
    IEntityTypeConfiguration<UserGroupApplicationAccess>
{
    public void Configure(
        EntityTypeBuilder<UserGroupApplicationAccess> builder)
    {
        builder.ToTable("mgmt_user_group_application_accesses");

        builder.HasKey(x => x.Id)
            .HasName("pk_mgmt_user_group_application_accesses");

        builder.Property(x => x.Id)
            .HasColumnName("mgmt_group_app_accesses_id")
            .UseIdentityByDefaultColumn();

        builder.Property(x => x.UserGroupId)
            .HasColumnName("mgmt_user_groups_id")
            .IsRequired();

        builder.Property(x => x.ApplicationId)
            .HasColumnName("mgmt_applications_id")
            .IsRequired();


        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.HasIndex(x => new
        {
            x.UserGroupId,
            x.ApplicationId
        })
            .IsUnique()
            .HasDatabaseName("ux_mgmt_group_app_accesses_group_app");

        builder.HasIndex(x => x.ApplicationId)
            .HasDatabaseName("ix_mgmt_group_app_accesses_mgmt_applications_id");

        builder.HasOne(x => x.UserGroup)
            .WithMany(x => x.Accesses)
            .HasForeignKey(x => x.UserGroupId)
            .HasConstraintName("fk_mgmt_group_app_accesses_mgmt_user_groups")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Application)
            .WithMany()
            .HasForeignKey(x => x.ApplicationId)
            .HasConstraintName("fk_mgmt_group_app_accesses_mgmt_applications")
            .OnDelete(DeleteBehavior.Cascade);
    }
}