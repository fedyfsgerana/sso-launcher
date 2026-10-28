using Microsoft.EntityFrameworkCore;

namespace SsoLauncher.Infrastructure.Persistence.Maintenance;

public sealed class AuditPartitionService(
    SsoLauncherDbContext dbContext)
{
    public const int MonthsAhead = 3;

    public async Task<int> EnsureAsync(CancellationToken cancellationToken = default)
    {
        var created = await dbContext.Database
            .SqlQueryRaw<int>(
                "SELECT audit_logs_ensure_partitions(now(), {0}) AS \"Value\"",
                MonthsAhead
            )
            .ToListAsync(cancellationToken);

        return created.FirstOrDefault();
    }

    public async Task<int> DropBeforeAsync(
        DateTimeOffset cutoff,
        CancellationToken cancellationToken = default)
    {
        var dropped = await dbContext.Database
            .SqlQueryRaw<int>(
                "SELECT audit_logs_drop_partitions_before({0}) AS \"Value\"",
                cutoff
            )
            .ToListAsync(cancellationToken);

        return dropped.FirstOrDefault();
    }
}
