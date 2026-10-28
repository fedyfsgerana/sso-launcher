using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Configurations;

public sealed class UserGroupMenuActionConfiguration
    : IEntityTypeConfiguration<UserGroupMenuAction>
{
    public void Configure(EntityTypeBuilder<UserGroupMenuAction> builder)
    {
        builder.ToTable("mgmt_group_menu_actions");

        builder.HasKey(x => x.Id)
            .HasName("pk_mgmt_group_menu_actions");

        builder.Property(x => x.Id)
            .HasColumnName("mgmt_group_menu_actions_id")
            .UseIdentityByDefaultColumn();

        builder.Property(x => x.UserGroupId)
            .HasColumnName("mgmt_user_groups_id");

        builder.Property(x => x.PortalMenuId)
            .HasColumnName("mgmt_portal_menus_id");

        builder.Property(x => x.ActionKey)
            .HasColumnName("action_key")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at");

        builder.HasIndex(x => new
        {
            x.UserGroupId,
            x.PortalMenuId,
            x.ActionKey
        })
            .IsUnique()
            .HasDatabaseName("ux_mgmt_group_menu_actions_group_menu_action");

        builder.HasIndex(x => x.PortalMenuId)
            .HasDatabaseName("ix_mgmt_group_menu_actions_mgmt_portal_menus_id");

        builder.HasOne(x => x.UserGroup)
            .WithMany()
            .HasForeignKey(x => x.UserGroupId)
            .HasConstraintName("fk_mgmt_group_menu_actions_mgmt_user_groups")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.PortalMenu)
            .WithMany()
            .HasForeignKey(x => x.PortalMenuId)
            .HasConstraintName("fk_mgmt_group_menu_actions_mgmt_portal_menus")
            .OnDelete(DeleteBehavior.Cascade);
    }
}
