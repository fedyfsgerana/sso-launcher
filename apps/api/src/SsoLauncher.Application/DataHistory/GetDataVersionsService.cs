using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;

namespace SsoLauncher.Application.DataHistory;

public sealed class GetDataVersionsService(
    ISsoLauncherDbContext dbContext)
{
    public async Task<IReadOnlyList<DataVersionResponse>> GetAsync(
        string entityType,
        long entityId,
        CancellationToken cancellationToken = default)
    {
        var versions = await (
                from version in dbContext.DataVersions.AsNoTracking()
                where version.EntityType == entityType &&
                      version.EntityId == entityId
                join log in dbContext.AuditLogs.AsNoTracking()
                    on version.AuditLogId equals (long?)log.Id into logs
                from log in logs.DefaultIfEmpty()
                orderby version.Version
                select new
                {
                    version.Version,
                    version.Action,
                    version.ActorName,
                    version.CreatedAt,
                    version.AuditLogId,
                    version.Snapshot,
                    Summary = log != null ? log.Summary : null,
                    Reason = log != null ? log.Reason : null
                })
            .ToListAsync(cancellationToken);

        var result = new List<DataVersionResponse>();
        JsonObject? previous = null;

        for (var index = 0; index < versions.Count; index++)
        {
            var item = versions[index];
            var snapshot = AuditSnapshot.Parse(item.Snapshot);

            result.Add(new DataVersionResponse(
                item.Version,
                item.Action,
                item.ActorName,
                item.CreatedAt,
                item.AuditLogId,
                item.Summary ?? string.Empty,
                item.Reason,
                index == versions.Count - 1,
                snapshot,
                AuditSnapshot.Diff(previous, snapshot)
            ));

            previous = snapshot;
        }

        result.Reverse();

        return result;
    }
}
