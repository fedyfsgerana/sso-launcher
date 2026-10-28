using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Configurations;

public sealed class UserGroupMemberConfiguration :
    IEntityTypeConfiguration<UserGroupMember>
{
    public void Configure(
        EntityTypeBuilder<UserGroupMember> builder)
    {
        builder.ToTable("mgmt_user_group_members");

        builder.HasKey(x => x.Id)
            .HasName("pk_mgmt_user_group_members");

        builder.Property(x => x.Id)
            .HasColumnName("mgmt_group_members_id")
            .UseIdentityByDefaultColumn();

        builder.Property(x => x.UserGroupId)
            .HasColumnName("mgmt_user_groups_id")
            .IsRequired();

        builder.Property(x => x.UserId)
            .HasColumnName("mgmt_users_id")
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.HasIndex(x => new
        {
            x.UserGroupId,
            x.UserId
        })
            .IsUnique()
            .HasDatabaseName("ux_mgmt_user_group_members_group_user");

        builder.HasIndex(x => x.UserId)
            .HasDatabaseName("ix_mgmt_user_group_members_mgmt_users_id");

        builder.HasOne(x => x.UserGroup)
            .WithMany(x => x.Members)
            .HasForeignKey(x => x.UserGroupId)
            .HasConstraintName("fk_mgmt_user_group_members_mgmt_user_groups")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.User)
            .WithMany(x => x.GroupMemberships)
            .HasForeignKey(x => x.UserId)
            .HasConstraintName("fk_mgmt_user_group_members_mgmt_users")
            .OnDelete(DeleteBehavior.Cascade);
    }
}
