using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.Notifications;

public sealed class Notifier(
    ISsoLauncherDbContext dbContext,
    AuditScope auditScope)
{
    private const string UsersMenuTarget = "users";

    public async Task<AccessSnapshot> CaptureAccessAsync(
        IEnumerable<long> userIds,
        CancellationToken cancellationToken)
    {
        var ids = userIds.Distinct().ToList();

        return new AccessSnapshot(
            ids,
            await ApplicationIdsAsync(ids, cancellationToken)
        );
    }

    public async Task NotifyAccessChangesAsync(
        AccessSnapshot before,
        CancellationToken cancellationToken)
    {
        if (before.UserIds.Count == 0)
        {
            return;
        }

        var after = await ApplicationIdsAsync(before.UserIds, cancellationToken);

        var changedApplicationIds = before.UserIds
            .SelectMany(userId =>
                Access(before.Applications, userId)
                    .SymmetricExcept(Access(after, userId)))
            .Distinct()
            .ToList();

        if (changedApplicationIds.Count == 0)
        {
            return;
        }

        var names = await dbContext.Applications
            .IgnoreQueryFilters()
            .Where(x => changedApplicationIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.Name, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var muted = await MutedAsync(
            before.UserIds,
            x => !x.AccessChanges,
            cancellationToken
        );

        foreach (var userId in before.UserIds.Where(x => IsNotActor(x) && !muted.Contains(x)))
        {
            var previous = Access(before.Applications, userId);
            var current = Access(after, userId);

            foreach (var applicationId in current.Except(previous))
            {
                Add(
                    userId,
                    NotificationKinds.AccessGranted,
                    "Akses aplikasi baru",
                    $"Anda sekarang bisa membuka {Name(names, applicationId)}.",
                    "/my-apps",
                    now
                );
            }

            foreach (var applicationId in previous.Except(current))
            {
                Add(
                    userId,
                    NotificationKinds.AccessRevoked,
                    "Akses aplikasi dicabut",
                    $"Akses Anda ke {Name(names, applicationId)} telah dicabut.",
                    null,
                    now
                );
            }
        }
    }

    public async Task NotifyApplicationStatusAsync(
        long applicationId,
        string applicationName,
        string previousStatus,
        string currentStatus,
        string maintenanceMessage,
        CancellationToken cancellationToken)
    {
        string kind;
        string title;
        string body;

        if (currentStatus == ApplicationStatuses.Maintenance &&
            previousStatus != ApplicationStatuses.Maintenance)
        {
            kind = NotificationKinds.ApplicationMaintenance;
            title = "Aplikasi sedang maintenance";
            body = string.IsNullOrWhiteSpace(maintenanceMessage)
                ? $"{applicationName} sedang maintenance dan belum bisa dibuka."
                : $"{applicationName} sedang maintenance: {maintenanceMessage.Trim()}";
        }
        else if (currentStatus == ApplicationStatuses.Active &&
                 previousStatus == ApplicationStatuses.Maintenance)
        {
            kind = NotificationKinds.ApplicationActive;
            title = "Aplikasi kembali aktif";
            body = $"{applicationName} sudah bisa dibuka kembali.";
        }
        else
        {
            return;
        }

        var userIds = await dbContext.UserGroupApplicationAccesses
            .Where(x => x.ApplicationId == applicationId && x.UserGroup.IsActive)
            .SelectMany(x => x.UserGroup.Members)
            .Select(x => x.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var muted = await MutedAsync(
            userIds,
            x => !x.ApplicationStatus,
            cancellationToken
        );

        foreach (var userId in userIds.Where(x => IsNotActor(x) && !muted.Contains(x)))
        {
            Add(userId, kind, title, body, "/my-apps", now);
        }
    }

    public void NotifyPasswordReset(long userId, string actorName)
    {
        if (!IsNotActor(userId))
        {
            return;
        }

        Add(
            userId,
            NotificationKinds.PasswordReset,
            "Password direset",
            $"Password Anda direset oleh {actorName}. Hubungi Administrator Sistem kalau Anda tidak memintanya.",
            "/profile",
            DateTimeOffset.UtcNow
        );
    }

    private static string DescribeAddress(string ipAddress)
    {
        return ipAddress is "::1" or "127.0.0.1" or "localhost"
            ? "komputer ini"
            : ipAddress;
    }

    public void NotifyNewDevice(long userId, string device)
    {
        Add(
            userId,
            NotificationKinds.NewDevice,
            "Login dari perangkat baru",
            $"Akun Anda masuk dari {device}. Kalau bukan Anda, segera ganti password.",
            "/profile",
            DateTimeOffset.UtcNow
        );
    }

    public async Task NotifyAccountLockedAsync(
        long? userId,
        string email,
        string ipAddress,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;

        if (userId is not null)
        {
            Add(
                userId.Value,
                NotificationKinds.AccountLocked,
                "Akun dikunci sementara",
                $"Terlalu banyak percobaan login gagal ke akun Anda dari {DescribeAddress(ipAddress)}. Kalau bukan Anda, segera ganti password.",
                "/profile",
                now
            );
        }

        var administratorIds = await dbContext.UserGroupMenuAccesses
            .Where(x =>
                x.PortalMenu.IsActive &&
                x.PortalMenu.TargetValue == UsersMenuTarget &&
                x.UserGroup.IsActive)
            .SelectMany(x => x.UserGroup.Members)
            .Select(x => x.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (var administratorId in administratorIds.Where(x => x != userId))
        {
            Add(
                administratorId,
                NotificationKinds.UserLocked,
                "Akun pengguna terkunci",
                $"Login {email} dikunci sementara setelah terlalu banyak percobaan gagal dari {DescribeAddress(ipAddress)}.",
                "/users",
                now
            );
        }
    }

    private async Task<HashSet<long>> MutedAsync(
        IReadOnlyCollection<long> userIds,
        System.Linq.Expressions.Expression<Func<NotificationSetting, bool>> muted,
        CancellationToken cancellationToken)
    {
        var ids = await dbContext.NotificationSettings
            .Where(x => userIds.Contains(x.UserId))
            .Where(muted)
            .Select(x => x.UserId)
            .ToListAsync(cancellationToken);

        return ids.ToHashSet();
    }

    private bool IsNotActor(long userId)
    {
        return auditScope.ActorId != userId;
    }

    private void Add(
        long userId,
        string kind,
        string title,
        string body,
        string? link,
        DateTimeOffset now)
    {
        dbContext.Notifications.Add(new Notification
        {
            UserId = userId,
            Kind = kind,
            Title = title,
            Body = body,
            Link = link,
            CreatedAt = now
        });
    }

    private async Task<Dictionary<long, HashSet<long>>> ApplicationIdsAsync(
        IReadOnlyCollection<long> userIds,
        CancellationToken cancellationToken)
    {
        if (userIds.Count == 0)
        {
            return new Dictionary<long, HashSet<long>>();
        }

        var fromGroups = dbContext.UserGroupMembers
            .Where(x => userIds.Contains(x.UserId) && x.UserGroup.IsActive)
            .SelectMany(
                x => x.UserGroup.Accesses,
                (member, access) => new { member.UserId, access.ApplicationId });

        var rows = await fromGroups.ToListAsync(cancellationToken);

        return rows
            .GroupBy(x => x.UserId)
            .ToDictionary(
                x => x.Key,
                x => x.Select(row => row.ApplicationId).ToHashSet()
            );
    }

    private static HashSet<long> Access(
        IReadOnlyDictionary<long, HashSet<long>> map,
        long userId)
    {
        return map.TryGetValue(userId, out var ids) ? ids : [];
    }

    private static string Name(
        IReadOnlyDictionary<long, string> names,
        long applicationId)
    {
        return names.TryGetValue(applicationId, out var name) ? name : "sebuah aplikasi";
    }
}

public sealed record AccessSnapshot(
    IReadOnlyList<long> UserIds,
    IReadOnlyDictionary<long, HashSet<long>> Applications
);

internal static class SetExtensions
{
    public static IEnumerable<long> SymmetricExcept(
        this HashSet<long> left,
        HashSet<long> right)
    {
        return left.Except(right).Concat(right.Except(left));
    }
}
