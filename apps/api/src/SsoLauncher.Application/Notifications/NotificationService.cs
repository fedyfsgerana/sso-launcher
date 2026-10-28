using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;

namespace SsoLauncher.Application.Notifications;

public sealed class NotificationService(ISsoLauncherDbContext dbContext)
{
    private const int Limit = 20;
    private static readonly TimeSpan Retention = TimeSpan.FromDays(30);

    public async Task<NotificationListResponse> GetAsync(
        long userId,
        CancellationToken cancellationToken = default)
    {
        var since = DateTimeOffset.UtcNow.Subtract(Retention);

        var query = dbContext.Notifications
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.CreatedAt >= since);

        var unread = await query.CountAsync(x => x.ReadAt == null, cancellationToken);

        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Take(Limit)
            .Select(x => new NotificationResponse(
                x.Id,
                x.Kind,
                x.Title,
                x.Body,
                x.Link,
                x.CreatedAt,
                x.ReadAt != null
            ))
            .ToListAsync(cancellationToken);

        return new NotificationListResponse(unread, items);
    }

    public async Task<bool> DeleteAsync(
        long userId,
        long notificationId,
        CancellationToken cancellationToken = default)
    {
        var removed = await dbContext.Notifications
            .Where(x => x.UserId == userId && x.Id == notificationId)
            .ExecuteDeleteAsync(cancellationToken);

        return removed > 0;
    }

    public async Task<int> ClearAsync(
        long userId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Notifications
            .Where(x => x.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);
    }

    public async Task<int> MarkAllReadAsync(
        long userId,
        CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;

        return await dbContext.Notifications
            .Where(x => x.UserId == userId && x.ReadAt == null)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(x => x.ReadAt, now),
                cancellationToken
            );
    }
}

public sealed record NotificationListResponse(
    int Unread,
    IReadOnlyList<NotificationResponse> Items
);

public sealed record NotificationResponse(
    long Id,
    string Kind,
    string Title,
    string Body,
    string? Link,
    DateTimeOffset CreatedAt,
    bool IsRead
);
