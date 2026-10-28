using System.Net;
using Microsoft.AspNetCore.HttpOverrides;

namespace SsoLauncher.Api.Security;

public static class ForwardedHeadersConfiguration
{
    public const string SectionName = "ForwardedHeaders";

    public static ForwardedHeadersOptions Create(IConfiguration configuration)
    {
        var section = configuration.GetSection(SectionName);

        var options = new ForwardedHeadersOptions
        {
            ForwardedHeaders =
                ForwardedHeaders.XForwardedFor |
                ForwardedHeaders.XForwardedProto
        };

        foreach (var value in Values(section, "KnownProxies"))
        {
            if (!IPAddress.TryParse(value, out var address))
            {
                throw new InvalidOperationException(
                    $"ForwardedHeaders:KnownProxies berisi alamat IP yang tidak valid: '{value}'."
                );
            }

            options.KnownProxies.Add(address);
        }

        foreach (var value in Values(section, "KnownNetworks"))
        {
            if (!System.Net.IPNetwork.TryParse(value, out var network))
            {
                throw new InvalidOperationException(
                    $"ForwardedHeaders:KnownNetworks berisi jaringan yang tidak valid: '{value}'. Gunakan format CIDR, misalnya 10.0.0.0/24."
                );
            }

            options.KnownIPNetworks.Add(network);
        }

        return options;
    }

    private static IEnumerable<string> Values(
        IConfigurationSection section,
        string key)
    {
        return section
            .GetSection(key)
            .GetChildren()
            .Select(x => x.Value?.Trim())
            .Where(x => !string.IsNullOrEmpty(x))
            .Select(x => x!);
    }
}
