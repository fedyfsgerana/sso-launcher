using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.Auth.Login;

public sealed class LoginLockoutService(
    ISsoLauncherDbContext dbContext,
    ILoginLockoutPolicy policy)
{
    public const string UnknownAddress = "unknown";

    private const int EmailMaxLength = 100;

    public static string NormalizeAddress(string? ipAddress)
    {
        return string.IsNullOrWhiteSpace(ipAddress)
            ? UnknownAddress
            : ipAddress.Trim();
    }

    public async Task<DateTimeOffset?> GetLockedUntilAsync(
        string email,
        string ipAddress,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var failures = await RecentFailuresAsync(
            email,
            now,
            cancellationToken
        );

        return LockedUntil(failures, ipAddress);
    }

    public async Task<DateTimeOffset?> RegisterFailureAsync(
        string email,
        string ipAddress,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var key = Key(email);

        var failures = await RecentFailuresAsync(
            key,
            now,
            cancellationToken
        );

        failures.Insert(0, new FailureEntry(ipAddress, now));

        dbContext.LoginFailures.Add(new LoginFailure
        {
            Email = key,
            IpAddress = ipAddress,
            OccurredAt = now
        });

        var addressCount = failures.Count(x => x.IpAddress == ipAddress);

        var reachedLimit =
            addressCount == policy.MaxFailuresPerAddress ||
            failures.Count == policy.MaxFailuresPerAccount;

        return reachedLimit ? LockedUntil(failures, ipAddress) : null;
    }

    public async Task<int> ClearAsync(
        string email,
        string? ipAddress,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var key = Key(email);

        var query = dbContext.LoginFailures
            .Where(x => x.Email == key && x.ClearedAt == null);

        if (ipAddress is not null)
        {
            query = query.Where(x => x.IpAddress == ipAddress);
        }

        var failures = await query.ToListAsync(cancellationToken);

        foreach (var failure in failures)
        {
            failure.ClearedAt = now;
        }

        return failures.Count;
    }

    public async Task<LoginLockStatus> GetStatusAsync(
        string email,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var failures = await RecentFailuresAsync(
            email,
            now,
            cancellationToken
        );

        var lockedAddresses = failures
            .GroupBy(x => x.IpAddress)
            .Select(group => new
            {
                IpAddress = group.Key,
                Items = group.OrderByDescending(x => x.OccurredAt).ToList()
            })
            .Where(x => x.Items.Count >= policy.MaxFailuresPerAddress)
            .Select(x => new LockedAddress(
                x.IpAddress,
                x.Items.Count,
                x.Items[policy.MaxFailuresPerAddress - 1].OccurredAt
                    .Add(policy.Window)
            ))
            .OrderByDescending(x => x.LockedUntil)
            .ToList();

        return new LoginLockStatus(
            failures.Count,
            AccountLockedUntil(failures),
            lockedAddresses
        );
    }

    private DateTimeOffset? LockedUntil(
        IReadOnlyList<FailureEntry> failures,
        string ipAddress)
    {
        var fromAddress = failures
            .Where(x => x.IpAddress == ipAddress)
            .ToList();

        DateTimeOffset? addressLock =
            fromAddress.Count >= policy.MaxFailuresPerAddress
                ? fromAddress[policy.MaxFailuresPerAddress - 1].OccurredAt
                    .Add(policy.Window)
                : null;

        var accountLock = AccountLockedUntil(failures);

        if (addressLock is null)
        {
            return accountLock;
        }

        if (accountLock is null)
        {
            return addressLock;
        }

        return addressLock > accountLock ? addressLock : accountLock;
    }

    private DateTimeOffset? AccountLockedUntil(
        IReadOnlyList<FailureEntry> failures)
    {
        return failures.Count >= policy.MaxFailuresPerAccount
            ? failures[policy.MaxFailuresPerAccount - 1].OccurredAt
                .Add(policy.Window)
            : null;
    }

    private async Task<List<FailureEntry>> RecentFailuresAsync(
        string email,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var key = Key(email);
        var since = now.Subtract(policy.Window);

        return await dbContext.LoginFailures
            .AsNoTracking()
            .Where(x =>
                x.Email == key &&
                x.ClearedAt == null &&
                x.OccurredAt > since)
            .OrderByDescending(x => x.OccurredAt)
            .Select(x => new FailureEntry(x.IpAddress, x.OccurredAt))
            .ToListAsync(cancellationToken);
    }

    private static string Key(string email)
    {
        return email.Length > EmailMaxLength
            ? email[..EmailMaxLength]
            : email;
    }

    private sealed record FailureEntry(
        string IpAddress,
        DateTimeOffset OccurredAt
    );
}