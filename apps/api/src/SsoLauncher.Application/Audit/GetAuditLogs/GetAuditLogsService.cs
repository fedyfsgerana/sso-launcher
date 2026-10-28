#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.Audit.GetAuditLogs;

public sealed class GetAuditLogsService(
    ISsoLauncherDbContext dbContext)
{
    private const int MaximumPageSize = 100;
    private const int MaximumExportRows = 10000;

    public async Task<AuditLogPageResponse> GetAsync(
        int page,
        int pageSize,
        AuditLogFilter filter,
        CancellationToken cancellationToken = default)
    {
        var size = pageSize <= 0
            ? 10
            : Math.Min(pageSize, MaximumPageSize);

        var query = Filter(filter);

        var total = await query.CountAsync(cancellationToken);
        var pages = Math.Max(1, (int)Math.Ceiling(total / (double)size));
        var current = Math.Clamp(page, 1, pages);

        var rows = await Project(
                ApplySort(query, filter)
                    .Skip((current - 1) * size)
                    .Take(size)
            )
            .ToListAsync(cancellationToken);

        return new AuditLogPageResponse(
            rows.Select(ToResponse).ToList(),
            total,
            current,
            size
        );
    }

    public async Task<IReadOnlyList<AuditLogResponse>> ExportAsync(
        AuditLogFilter filter,
        CancellationToken cancellationToken = default)
    {
        var rows = await Project(
                ApplySort(Filter(filter), filter)
                    .Take(MaximumExportRows)
            )
            .ToListAsync(cancellationToken);

        return rows.Select(ToResponse).ToList();
    }

    private static IQueryable<AuditLog> ApplySort(
        IQueryable<AuditLog> query,
        AuditLogFilter filter)
    {
        var ascending = string.Equals(
            filter.Direction,
            "asc",
            StringComparison.OrdinalIgnoreCase
        );

        IOrderedQueryable<AuditLog> ordered = filter.Sort switch
        {
            "actor" => ascending
                ? query.OrderBy(x => x.ActorName)
                : query.OrderByDescending(x => x.ActorName),
            "action" => ascending
                ? query.OrderBy(x => x.Action)
                : query.OrderByDescending(x => x.Action),
            "target" => ascending
                ? query.OrderBy(x => x.TargetName)
                : query.OrderByDescending(x => x.TargetName),
            _ => ascending
                ? query.OrderBy(x => x.OccurredAt)
                : query.OrderByDescending(x => x.OccurredAt)
        };

        return ascending
            ? ordered.ThenBy(x => x.Id)
            : ordered.ThenByDescending(x => x.Id);
    }

    public async Task<AuditLogDetailResponse?> GetDetailAsync(
        long id,
        CancellationToken cancellationToken = default)
    {
        var log = await dbContext.AuditLogs
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.Id == id,
                cancellationToken
            );

        if (log is null)
        {
            return null;
        }

        var version = await dbContext.DataVersions
            .AsNoTracking()
            .Where(x => x.AuditLogId == id)
            .Select(x => (int?)x.Version)
            .FirstOrDefaultAsync(cancellationToken);

        return new AuditLogDetailResponse(
            log.Id,
            log.ActorId,
            log.ActorName,
            log.Action,
            log.Outcome,
            AuditModules.ForTarget(log.TargetType),
            log.TargetType,
            log.TargetId,
            log.TargetName,
            log.Summary,
            log.Reason,
            log.OccurredAt,
            log.IpAddress,
            log.DeviceName,
            log.DeviceType,
            log.OperatingSystem,
            log.Browser,
            log.BrowserVersion,
            log.UserAgent,
            log.SessionRef,
            log.RequestId,
            log.HttpMethod,
            log.RequestPath,
            version,
            AuditSnapshot.ParseChanges(log.Changes)
        );
    }

    public async Task<AuditSummaryResponse> GetSummaryAsync(
        int utcOffsetMinutes,
        CancellationToken cancellationToken = default)
    {
        var offset = TimeSpan.FromMinutes(Math.Clamp(utcOffsetMinutes, -840, 840));
        var localNow = DateTimeOffset.UtcNow.ToOffset(offset);
        var startOfToday = new DateTimeOffset(localNow.Date, offset).ToUniversalTime();
        var sevenDaysAgo = startOfToday.AddDays(-6);

        var logs = dbContext.AuditLogs.AsNoTracking();

        var today = await logs.CountAsync(
            x => x.OccurredAt >= startOfToday,
            cancellationToken
        );

        var lastSevenDays = await logs.CountAsync(
            x => x.OccurredAt >= sevenDaysAgo,
            cancellationToken
        );

        var deletions = await logs.CountAsync(
            x =>
                x.OccurredAt >= sevenDaysAgo &&
                x.Action == AuditActions.Delete,
            cancellationToken
        );

        var failed = await logs.CountAsync(
            x =>
                x.OccurredAt >= sevenDaysAgo &&
                x.Outcome == AuditOutcomes.Failed,
            cancellationToken
        );

        return new AuditSummaryResponse(today, lastSevenDays, deletions, failed);
    }

    public async Task<IReadOnlyList<AuditActorResponse>> GetActorsAsync(
        CancellationToken cancellationToken = default)
    {
        var actors = await dbContext.AuditLogs
            .AsNoTracking()
            .Where(x => x.ActorId != null)
            .GroupBy(x => new
            {
                ActorId = x.ActorId!.Value,
                x.ActorName
            })
            .Select(group => new
            {
                group.Key.ActorId,
                group.Key.ActorName,
                LastSeen = group.Max(x => x.OccurredAt)
            })
            .ToListAsync(cancellationToken);

        return actors
            .GroupBy(x => x.ActorId)
            .Select(group => group
                .OrderByDescending(x => x.LastSeen)
                .First())
            .OrderBy(x => x.ActorName)
            .Select(x => new AuditActorResponse(x.ActorId, x.ActorName))
            .ToList();
    }

    private IQueryable<AuditLog> Filter(AuditLogFilter filter)
    {
        var query = dbContext.AuditLogs
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Action))
        {
            query = query.Where(x => x.Action == filter.Action);
        }

        if (!string.IsNullOrWhiteSpace(filter.Module))
        {
            var targets = AuditModules.TargetsFor(filter.Module).ToList();

            query = query.Where(x => targets.Contains(x.TargetType));
        }

        if (!string.IsNullOrWhiteSpace(filter.TargetType))
        {
            query = query.Where(x => x.TargetType == filter.TargetType);
        }

        if (!string.IsNullOrWhiteSpace(filter.Outcome))
        {
            query = query.Where(x => x.Outcome == filter.Outcome);
        }

        if (!string.IsNullOrWhiteSpace(filter.IpAddress))
        {
            var ip = filter.IpAddress.Trim();

            query = query.Where(x => x.IpAddress != null && x.IpAddress.StartsWith(ip));
        }

        if (filter.TargetId is not null)
        {
            query = query.Where(x => x.TargetId == filter.TargetId);
        }

        if (filter.ActorId is not null)
        {
            query = query.Where(x => x.ActorId == filter.ActorId);
        }

        if (filter.From is { } fromValue)
        {
            var fromUtc = fromValue.ToUniversalTime();

            query = query.Where(x => x.OccurredAt >= fromUtc);
        }

        if (filter.To is { } toValue)
        {
            var toUtc = toValue.ToUniversalTime();

            query = query.Where(x => x.OccurredAt < toUtc);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.Trim().ToLower();

            query = query.Where(x =>
                x.ActorName.ToLower().Contains(term) ||
                x.TargetName.ToLower().Contains(term) ||
                x.Summary.ToLower().Contains(term) ||
                (x.Reason != null && x.Reason.ToLower().Contains(term)) ||
                (x.DeviceName != null && x.DeviceName.ToLower().Contains(term)) ||
                (x.IpAddress != null && x.IpAddress.Contains(term)));
        }

        return query;
    }

    private static IQueryable<AuditLogRow> Project(
        IQueryable<AuditLog> query)
    {
        return query.Select(x => new AuditLogRow(
            x.Id,
            x.ActorId,
            x.ActorName,
            x.Action,
            x.TargetType,
            x.TargetId,
            x.TargetName,
            x.Summary,
            x.OccurredAt,
            x.Outcome,
            x.Reason,
            x.IpAddress,
            x.DeviceName,
            x.DeviceType,
            x.OperatingSystem,
            x.Browser,
            x.BrowserVersion,
            x.Changes != null
        ));
    }

    private static AuditLogResponse ToResponse(AuditLogRow row)
    {
        return new AuditLogResponse(
            row.Id,
            row.ActorId,
            row.ActorName,
            row.Action,
            row.TargetType,
            row.TargetId,
            row.TargetName,
            row.Summary,
            row.OccurredAt,
            AuditModules.ForTarget(row.TargetType),
            row.Outcome,
            row.Reason,
            row.IpAddress,
            row.DeviceName,
            row.DeviceType,
            row.OperatingSystem,
            row.Browser,
            row.BrowserVersion,
            row.HasChanges
        );
    }

    private sealed record AuditLogRow(
        long Id,
        long? ActorId,
        string ActorName,
        string Action,
        string TargetType,
        long? TargetId,
        string TargetName,
        string Summary,
        DateTimeOffset OccurredAt,
        string Outcome,
        string? Reason,
        string? IpAddress,
        string? DeviceName,
        string? DeviceType,
        string? OperatingSystem,
        string? Browser,
        string? BrowserVersion,
        bool HasChanges
    );
}
