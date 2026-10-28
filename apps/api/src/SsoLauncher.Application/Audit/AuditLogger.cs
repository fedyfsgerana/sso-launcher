using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.Audit;

public sealed class AuditLogger(
    ISsoLauncherDbContext dbContext,
    IAuditContextAccessor auditContextAccessor,
    AuditScope auditScope)
{
    public AuditLog Record(
        long? actorId,
        string actorName,
        string action,
        string targetType,
        long? targetId,
        string targetName,
        string summary = "",
        string? reason = null,
        string outcome = AuditOutcomes.Success)
    {
        var context = auditContextAccessor.Current;

        reason ??= auditScope.DeleteReason;

        var entry = new AuditLog
        {
            ActorId = actorId,
            ActorName = Limit(actorName, 150),
            Action = action,
            Outcome = outcome,
            TargetType = targetType,
            TargetId = targetId,
            TargetName = Limit(targetName, 200),
            Summary = Limit(summary, 500),
            Reason = string.IsNullOrWhiteSpace(reason)
                ? null
                : Limit(reason.Trim(), 500),
            IpAddress = context.IpAddress,
            UserAgent = context.UserAgent,
            Browser = context.Browser,
            BrowserVersion = context.BrowserVersion,
            OperatingSystem = context.OperatingSystem,
            DeviceType = context.DeviceType,
            DeviceName = context.DeviceName,
            SessionRef = context.SessionRef,
            RequestId = context.RequestId,
            HttpMethod = context.HttpMethod,
            RequestPath = context.RequestPath,
            OccurredAt = DateTimeOffset.UtcNow
        };

        dbContext.AuditLogs.Add(entry);

        return entry;
    }

    public async Task<AuditLog> RecordChangeAsync(
        long? actorId,
        string actorName,
        string action,
        string targetType,
        long targetId,
        string targetName,
        object? before,
        object? after,
        string summary = "",
        string? reason = null,
        CancellationToken cancellationToken = default)
    {
        var beforeNode = AuditSnapshot.Capture(before);
        var afterNode = AuditSnapshot.Capture(after);
        var changes = AuditSnapshot.Diff(beforeNode, afterNode);

        var entry = Record(
            actorId,
            actorName,
            action,
            targetType,
            targetId,
            targetName,
            summary,
            reason
        );

        if (changes.Count > 0)
        {
            entry.Changes = AuditSnapshot.SerializeChanges(changes);
        }

        if (changes.Count == 0 &&
            beforeNode is not null &&
            afterNode is not null)
        {
            return entry;
        }

        var snapshot = afterNode ?? beforeNode;

        if (snapshot is null)
        {
            return entry;
        }

        var lastVersion = await GetLastVersionAsync(
            targetType,
            targetId,
            cancellationToken
        );

        if (lastVersion == 0 &&
            beforeNode is not null &&
            action != AuditActions.Create)
        {
            lastVersion = 1;

            dbContext.DataVersions.Add(new DataVersion
            {
                EntityType = targetType,
                EntityId = targetId,
                Version = lastVersion,
                Action = AuditActions.Baseline,
                Snapshot = AuditSnapshot.Serialize(beforeNode),
                ActorId = null,
                ActorName = string.Empty,
                CreatedAt = entry.OccurredAt
            });
        }

        dbContext.DataVersions.Add(new DataVersion
        {
            EntityType = targetType,
            EntityId = targetId,
            Version = lastVersion + 1,
            Action = action,
            Snapshot = AuditSnapshot.Serialize(snapshot),
            AuditLogId = entry.Id,
            ActorId = actorId,
            ActorName = entry.ActorName,
            CreatedAt = entry.OccurredAt
        });

        return entry;
    }

    public AuditLog RecordDiff(
        long? actorId,
        string actorName,
        string action,
        string targetType,
        long? targetId,
        string targetName,
        object? before,
        object? after,
        string summary = "")
    {
        var changes = AuditSnapshot.Diff(
            AuditSnapshot.Capture(before),
            AuditSnapshot.Capture(after)
        );

        var entry = Record(
            actorId,
            actorName,
            action,
            targetType,
            targetId,
            targetName,
            summary
        );

        if (changes.Count > 0)
        {
            entry.Changes = AuditSnapshot.SerializeChanges(changes);
        }

        return entry;
    }

    public async Task SaveAsync(
        CancellationToken cancellationToken = default)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<int> GetLastVersionAsync(
        string entityType,
        long entityId,
        CancellationToken cancellationToken)
    {
        var stored = await dbContext.DataVersions
            .Where(x =>
                x.EntityType == entityType &&
                x.EntityId == entityId)
            .MaxAsync(
                x => (int?)x.Version,
                cancellationToken
            ) ?? 0;

        var pending = dbContext.DataVersions.Local
            .Where(x =>
                x.EntityType == entityType &&
                x.EntityId == entityId)
            .Select(x => x.Version)
            .DefaultIfEmpty(0)
            .Max();

        return Math.Max(stored, pending);
    }

    private static string Limit(string value, int length)
    {
        return value.Length <= length
            ? value
            : value[..length];
    }
}
