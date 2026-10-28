using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Configurations;

public sealed class LoginFailureConfiguration :
    IEntityTypeConfiguration<LoginFailure>
{
    public void Configure(
        EntityTypeBuilder<LoginFailure> builder)
    {
        builder.ToTable("mgmt_login_failures");

        builder.HasKey(x => x.Id)
            .HasName("pk_mgmt_login_failures");

        builder.Property(x => x.Id)
            .HasColumnName("mgmt_login_failures_id")
            .UseIdentityByDefaultColumn();

        builder.Property(x => x.Email)
            .HasColumnName("email")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.IpAddress)
            .HasColumnName("ip_address")
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(x => x.OccurredAt)
            .HasColumnName("occurred_at")
            .IsRequired();

        builder.Property(x => x.ClearedAt)
            .HasColumnName("cleared_at");

        builder.HasIndex(x => new
        {
            x.Email,
            x.OccurredAt
        })
            .HasDatabaseName("ix_mgmt_login_failures_email_occurred_at");

        builder.HasIndex(x => new
        {
            x.Email,
            x.IpAddress,
            x.OccurredAt
        })
            .HasDatabaseName("ix_mgmt_login_failures_email_ip_occurred_at");
    }
}