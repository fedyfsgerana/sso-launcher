using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Configurations;

public sealed class SsoTokenUseConfiguration :
    IEntityTypeConfiguration<SsoTokenUse>
{
    public void Configure(
        EntityTypeBuilder<SsoTokenUse> builder)
    {
        builder.ToTable("mgmt_sso_token_uses");

        builder.HasKey(x => x.Id)
            .HasName("pk_mgmt_sso_token_uses");

        builder.Property(x => x.Id)
            .HasColumnName("mgmt_sso_token_uses_id")
            .UseIdentityByDefaultColumn();

        builder.Property(x => x.TokenId)
            .HasColumnName("token_id")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.ExpiresAt)
            .HasColumnName("expires_at")
            .IsRequired();

        builder.Property(x => x.UsedAt)
            .HasColumnName("used_at")
            .IsRequired();

        builder.HasIndex(x => x.TokenId)
            .IsUnique()
            .HasDatabaseName("ux_mgmt_sso_token_uses_token_id");

        builder.HasIndex(x => x.ExpiresAt)
            .HasDatabaseName("ix_mgmt_sso_token_uses_expires_at");
    }
}
