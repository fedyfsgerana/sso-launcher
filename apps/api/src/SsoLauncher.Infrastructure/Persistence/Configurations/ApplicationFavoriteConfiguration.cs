using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Configurations;

public sealed class ApplicationFavoriteConfiguration :
    IEntityTypeConfiguration<ApplicationFavorite>
{
    public void Configure(
        EntityTypeBuilder<ApplicationFavorite> builder)
    {
        builder.ToTable("portal_favorites");

        builder.HasKey(x => x.Id)
            .HasName("pk_portal_favorites");

        builder.Property(x => x.Id)
            .HasColumnName("portal_favorites_id")
            .UseIdentityByDefaultColumn();

        builder.Property(x => x.UserId)
            .HasColumnName("mgmt_users_id")
            .IsRequired();

        builder.Property(x => x.ApplicationId)
            .HasColumnName("mgmt_applications_id")
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.HasIndex(x => new
        {
            x.UserId,
            x.ApplicationId
        })
            .IsUnique()
            .HasDatabaseName("ux_portal_favorites_user_app");

        builder.HasIndex(x => x.ApplicationId)
            .HasDatabaseName("ix_portal_favorites_mgmt_applications_id");

        builder.HasOne(x => x.User)
            .WithMany(x => x.Favorites)
            .HasForeignKey(x => x.UserId)
            .HasConstraintName("fk_portal_favorites_mgmt_users")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Application)
            .WithMany(x => x.Favorites)
            .HasForeignKey(x => x.ApplicationId)
            .HasConstraintName("fk_portal_favorites_mgmt_applications")
            .OnDelete(DeleteBehavior.Cascade);
    }
}
