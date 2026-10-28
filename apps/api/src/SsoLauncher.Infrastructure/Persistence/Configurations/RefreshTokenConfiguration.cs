using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Configurations;

public sealed class RefreshTokenConfiguration :
    IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(
        EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("mgmt_refresh_tokens");

        builder.HasKey(x => x.Id)
            .HasName("pk_mgmt_refresh_tokens");

        builder.Property(x => x.Id)
            .HasColumnName("mgmt_refresh_tokens_id")
            .UseIdentityByDefaultColumn();

        builder.Property(x => x.UserId)
            .HasColumnName("mgmt_users_id")
            .IsRequired();

        builder.Property(x => x.TokenHash)
            .HasColumnName("token_hash")
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(x => x.ExpiresAt)
            .HasColumnName("expires_at")
            .IsRequired();

        builder.Property(x => x.RevokedAt)
            .HasColumnName("revoked_at");

        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(x => x.LastSeenAt)
            .HasColumnName("last_seen_at");

        builder.HasIndex(x => x.ExpiresAt)
            .HasDatabaseName("ix_mgmt_refresh_tokens_expires_at");

        builder.HasIndex(x => x.TokenHash)
            .IsUnique()
            .HasDatabaseName("ux_mgmt_refresh_tokens_token_hash");

        builder.HasIndex(x => x.UserId)
            .HasDatabaseName("ix_mgmt_refresh_tokens_mgmt_users_id");

        builder.HasOne(x => x.User)
            .WithMany(x => x.RefreshTokens)
            .HasForeignKey(x => x.UserId)
            .HasConstraintName("fk_mgmt_refresh_tokens_mgmt_users")
            .OnDelete(DeleteBehavior.Cascade);
    }
}
