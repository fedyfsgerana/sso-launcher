using System.Net;
using System.Net.Sockets;
using Microsoft.Extensions.Caching.Memory;

namespace SsoLauncher.Api.Auditing;

public sealed class ClientDeviceNameResolver(IMemoryCache cache)
{
    private static readonly TimeSpan LookupTimeout =
        TimeSpan.FromMilliseconds(300);

    private static readonly TimeSpan CacheLifetime =
        TimeSpan.FromMinutes(30);

    public async Task<string?> ResolveAsync(
        IPAddress? address,
        CancellationToken cancellationToken)
    {
        if (address is null)
        {
            return null;
        }

        if (address.IsIPv4MappedToIPv6)
        {
            address = address.MapToIPv4();
        }

        if (IPAddress.IsLoopback(address))
        {
            return Environment.MachineName;
        }

        var key = $"device-name:{address}";

        if (cache.TryGetValue(key, out string? cached))
        {
            return cached;
        }

        string? name = null;

        try
        {
            using var timeout =
                CancellationTokenSource.CreateLinkedTokenSource(
                    cancellationToken
                );

            timeout.CancelAfter(LookupTimeout);

            var entry = await Dns.GetHostEntryAsync(
                address.ToString(),
                timeout.Token
            );

            if (!string.IsNullOrWhiteSpace(entry.HostName) &&
                entry.HostName != address.ToString())
            {
                name = entry.HostName;
            }
        }
        catch (Exception exception) when (
            exception is SocketException or
                OperationCanceledException or
                ArgumentException)
        {
            if (cancellationToken.IsCancellationRequested)
            {
                return null;
            }
        }

        cache.Set(key, name, CacheLifetime);

        return name;
    }
}