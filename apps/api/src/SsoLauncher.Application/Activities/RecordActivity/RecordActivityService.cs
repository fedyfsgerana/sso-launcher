using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Access;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.Activities.RecordActivity;

public sealed class RecordActivityService(
    ISsoLauncherDbContext dbContext)
{
    private const int MaxPerUser = 100;

    public async Task<long?> RecordAsync(
        long userId,
        RecordActivityRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!PortalActivityKinds.IsValid(request.Kind) ||
            request.ApplicationId is null ||
            string.IsNullOrWhiteSpace(request.Title) ||
            request.Title.Length > 200)
        {
            return null;
        }

        var now = DateTimeOffset.UtcNow;

        var hasAccess = await EffectiveAccessQueries
            .ApplicationIdsForUser(dbContext, userId)
            .AnyAsync(
                x => x == request.ApplicationId,
                cancellationToken
            );

        if (!hasAccess)
        {
            return null;
        }

        var previous = await dbContext.PortalActivities
            .Where(x =>
                x.UserId == userId &&
                x.ApplicationId == request.ApplicationId)
            .ToListAsync(cancellationToken);

        foreach (var item in previous)
        {
            dbContext.PortalActivities.Remove(item);
        }

        var activity = new PortalActivity
        {
            UserId = userId,
            ApplicationId = request.ApplicationId,
            Kind = request.Kind,
            Title = request.Title.Trim(),
            Subtitle = request.Subtitle?.Trim() ?? string.Empty,
            TargetPath = request.TargetPath?.Trim(),
            OccurredAt = now
        };

        dbContext.PortalActivities.Add(activity);

        await dbContext.SaveChangesAsync(cancellationToken);

        await TrimAsync(userId, cancellationToken);

        return activity.Id;
    }

    private async Task TrimAsync(
        long userId,
        CancellationToken cancellationToken)
    {
        var expired = await dbContext.PortalActivities
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.OccurredAt)
            .Skip(MaxPerUser)
            .ToListAsync(cancellationToken);

        if (expired.Count == 0)
        {
            return;
        }

        foreach (var item in expired)
        {
            dbContext.PortalActivities.Remove(item);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
