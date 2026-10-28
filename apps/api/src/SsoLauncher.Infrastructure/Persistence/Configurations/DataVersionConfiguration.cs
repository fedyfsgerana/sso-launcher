using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Configurations;

public sealed class DataVersionConfiguration :
    IEntityTypeConfiguration<DataVersion>
{
    public void Configure(
        EntityTypeBuilder<DataVersion> builder)
    {
        builder.ToTable("audit_data_versions");

        builder.HasKey(x => x.Id)
            .HasName("pk_audit_data_versions");

        builder.Property(x => x.Id)
            .HasColumnName("audit_data_versions_id")
            .UseIdentityByDefaultColumn();

        builder.Property(x => x.EntityType)
            .HasColumnName("entity_type")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.EntityId)
            .HasColumnName("entity_id")
            .IsRequired();

        builder.Property(x => x.Version)
            .HasColumnName("version")
            .IsRequired();

        builder.Property(x => x.Action)
            .HasColumnName("action")
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.Snapshot)
            .HasColumnName("snapshot")
            .HasColumnType("jsonb")
            .IsRequired();

        builder.Property(x => x.AuditLogId)
            .HasColumnName("audit_logs_id");

        builder.Property(x => x.ActorId)
            .HasColumnName("actor_id");

        builder.Property(x => x.ActorName)
            .HasColumnName("actor_name")
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.HasIndex(x => new
        {
            x.EntityType,
            x.EntityId,
            x.Version
        })
            .IsUnique()
            .HasDatabaseName("ux_audit_data_versions_entity_version");

        builder.HasIndex(x => x.AuditLogId)
            .HasDatabaseName("ix_audit_data_versions_audit_logs_id");
    }
}
