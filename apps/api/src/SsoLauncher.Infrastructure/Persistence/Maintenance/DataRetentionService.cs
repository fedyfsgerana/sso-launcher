using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SsoLauncher.Infrastructure.Persistence.Maintenance;

public sealed class DataRetentionService(
    SsoLauncherDbContext dbContext,
    AuditPartitionService auditPartitions,
    IOptions<DataRetentionOptions> options,
    ILogger<DataRetentionService> logger)
{
    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        var settings = options.Value;

        if (!settings.Enabled)
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;

        var versions = await DeleteAsync(
            "audit_data_versions",
            "audit_data_versions_id",
            "created_at",
            now.AddMonths(-Math.Max(1, settings.DataVersionMonths)),
            settings,
            cancellationToken
        );

        var auditCutoff = now.AddMonths(-Math.Max(1, settings.AuditLogMonths));

        var partitions = await auditPartitions.DropBeforeAsync(
            auditCutoff,
            cancellationToken
        );

        var logs = await DeleteAsync(
            "audit_logs",
            "audit_logs_id",
            "occurred_at",
            auditCutoff,
            settings,
            cancellationToken
        );

        var activities = await DeleteAsync(
            "portal_activities",
            "portal_activities_id",
            "occurred_at",
            now.AddMonths(-Math.Max(1, settings.ActivityMonths)),
            settings,
            cancellationToken
        );

        var notifications = await DeleteAsync(
            "portal_notifications",
            "portal_notifications_id",
            "created_at",
            now.AddMonths(-Math.Max(1, settings.NotificationMonths)),
            settings,
            cancellationToken
        );

        var tokenUses = await DeleteAsync(
            "mgmt_sso_token_uses",
            "mgmt_sso_token_uses_id",
            "expires_at",
            now.AddDays(-1),
            settings,
            cancellationToken
        );

        if (versions + partitions + logs + activities + notifications + tokenUses > 0)
        {
            logger.LogInformation(
                "Pembersihan data lama selesai: {Versions} versi data, {Partitions} partisi audit bulanan, {Logs} catatan audit, {Activities} aktivitas portal, {Notifications} notifikasi, {TokenUses} penanda token SSO dihapus.",
                versions,
                partitions,
                logs,
                activities,
                notifications,
                tokenUses
            );
        }
    }

    private async Task<int> DeleteAsync(
        string table,
        string keyColumn,
        string dateColumn,
        DateTimeOffset cutoff,
        DataRetentionOptions settings,
        CancellationToken cancellationToken)
    {
        var batchSize = Math.Clamp(settings.BatchSize, 100, 50_000);
        var maxBatches = Math.Clamp(settings.MaxBatchesPerRun, 1, 10_000);
        var sql =
            $"DELETE FROM {table} WHERE {keyColumn} IN (" +
            $"SELECT {keyColumn} FROM {table} WHERE {dateColumn} < {{0}} " +
            $"ORDER BY {keyColumn} LIMIT {batchSize})";

        var total = 0;

        for (var batch = 0; batch < maxBatches; batch++)
        {
            var affected = await dbContext.Database.ExecuteSqlRawAsync(
                sql,
                [cutoff],
                cancellationToken
            );

            total += affected;

            if (affected < batchSize)
            {
                break;
            }
        }

        return total;
    }
}
