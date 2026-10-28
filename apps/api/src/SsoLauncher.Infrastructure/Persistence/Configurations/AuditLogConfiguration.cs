using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Infrastructure.Persistence.Configurations;

public sealed class AuditLogConfiguration :
    IEntityTypeConfiguration<AuditLog>
{
    public void Configure(
        EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");

        builder.HasKey(x => new { x.Id, x.OccurredAt })
            .HasName("pk_audit_logs");

        builder.Property(x => x.Id)
            .HasColumnName("audit_logs_id")
            .ValueGeneratedOnAdd()
            .UseHiLo("audit_logs_hilo_seq");

        builder.Property(x => x.ActorId)
            .HasColumnName("actor_id");

        builder.Property(x => x.ActorName)
            .HasColumnName("actor_name")
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.Action)
            .HasColumnName("action")
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.Outcome)
            .HasColumnName("outcome")
            .HasMaxLength(20)
            .HasDefaultValue("success")
            .IsRequired();

        builder.Property(x => x.TargetType)
            .HasColumnName("target_type")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.TargetId)
            .HasColumnName("target_id");

        builder.Property(x => x.TargetName)
            .HasColumnName("target_name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.Summary)
            .HasColumnName("summary")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.Reason)
            .HasColumnName("reason")
            .HasMaxLength(500);

        builder.Property(x => x.Changes)
            .HasColumnName("changes")
            .HasColumnType("jsonb");

        builder.Property(x => x.IpAddress)
            .HasColumnName("ip_address")
            .HasMaxLength(64);

        builder.Property(x => x.UserAgent)
            .HasColumnName("user_agent")
            .HasMaxLength(512);

        builder.Property(x => x.Browser)
            .HasColumnName("browser")
            .HasMaxLength(60);

        builder.Property(x => x.BrowserVersion)
            .HasColumnName("browser_version")
            .HasMaxLength(40);

        builder.Property(x => x.OperatingSystem)
            .HasColumnName("operating_system")
            .HasMaxLength(60);

        builder.Property(x => x.DeviceType)
            .HasColumnName("device_type")
            .HasMaxLength(20);

        builder.Property(x => x.DeviceName)
            .HasColumnName("device_name")
            .HasMaxLength(255);

        builder.Property(x => x.SessionRef)
            .HasColumnName("session_ref")
            .HasMaxLength(32);

        builder.Property(x => x.RequestId)
            .HasColumnName("request_id")
            .HasMaxLength(100);

        builder.Property(x => x.HttpMethod)
            .HasColumnName("http_method")
            .HasMaxLength(10);

        builder.Property(x => x.RequestPath)
            .HasColumnName("request_path")
            .HasMaxLength(300);

        builder.Property(x => x.OccurredAt)
            .HasColumnName("occurred_at")
            .IsRequired();

        builder.HasIndex(x => x.OccurredAt)
            .HasDatabaseName("ix_audit_logs_occurred_at");

        builder.HasIndex(x => new
        {
            x.TargetType,
            x.TargetId
        })
            .HasDatabaseName("ix_audit_logs_target_type_target_id");

        builder.HasIndex(x => new
        {
            x.ActorId,
            x.OccurredAt
        })
            .HasDatabaseName("ix_audit_logs_actor_id_occurred_at");

        builder.HasIndex(x => x.Action)
            .HasDatabaseName("ix_audit_logs_action");

        builder.HasIndex(x => x.ActorName)
            .HasDatabaseName("ix_audit_logs_actor_name");

        builder.HasIndex(x => x.TargetName)
            .HasDatabaseName("ix_audit_logs_target_name");

        builder.HasOne(x => x.Actor)
            .WithMany()
            .HasForeignKey(x => x.ActorId)
            .HasConstraintName("fk_audit_logs_mgmt_users_actor")
            .OnDelete(DeleteBehavior.SetNull);
    }
}
