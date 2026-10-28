using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Configurations;

public sealed class ApplicationServiceCredentialConfiguration :
    IEntityTypeConfiguration<ApplicationServiceCredential>
{
    public void Configure(
        EntityTypeBuilder<ApplicationServiceCredential> builder)
    {
        builder.ToTable("mgmt_application_service_credentials");

        builder.HasKey(x => x.Id)
            .HasName("pk_mgmt_application_service_credentials");

        builder.Property(x => x.Id)
            .HasColumnName("mgmt_app_credentials_id")
            .UseIdentityByDefaultColumn();

        builder.Property(x => x.ApplicationId)
            .HasColumnName("mgmt_applications_id")
            .IsRequired();

        builder.Property(x => x.ClientId)
            .HasColumnName("client_id")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.SecretHash)
            .HasColumnName("secret_hash")
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(x => x.Scope)
            .HasColumnName("scope")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.IsActive)
            .HasColumnName("is_active")
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.Property(x => x.LastUsedAt)
            .HasColumnName("last_used_at");

        builder.Property(x => x.GuideDownloadedAt)
            .HasColumnName("guide_downloaded_at");

        builder.HasIndex(x => x.ClientId)
            .IsUnique()
            .HasDatabaseName("ux_mgmt_app_credentials_client_id");

        builder.HasIndex(x => x.ApplicationId)
            .HasDatabaseName("ix_mgmt_app_credentials_mgmt_applications_id");

        builder.HasOne(x => x.Application)
            .WithMany(x => x.ServiceCredentials)
            .HasForeignKey(x => x.ApplicationId)
            .HasConstraintName("fk_mgmt_app_credentials_mgmt_applications")
            .OnDelete(DeleteBehavior.Cascade);
    }
}
