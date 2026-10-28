using Microsoft.Extensions.Configuration;
using SsoLauncher.Api.Security;

namespace SsoLauncher.Api.Tests.Security;

public sealed class ProductionConfigurationCheckTests
{
    private static readonly Dictionary<string, string?> SafeSettings = new()
    {
        ["SsoToken:SigningKey"] = new string('a', 48),
        ["ServiceAccessToken:SigningKey"] = new string('b', 48),
        ["AllowedHosts"] = "sso-api.example.com",
        ["Cors:AllowedOrigins:0"] = "https://sso.example.com",
        ["ForwardedHeaders:KnownProxies:0"] = "10.0.0.5"
    };

    private static IConfiguration Build(
        params (string Key, string? Value)[] overrides)
    {
        var settings = new Dictionary<string, string?>(SafeSettings);

        foreach (var (key, value) in overrides)
        {
            if (value is null)
            {
                settings.Remove(key);
            }
            else
            {
                settings[key] = value;
            }
        }

        return new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();
    }

    [Fact]
    public void Safe_settings_have_no_problems_or_warnings()
    {
        var configuration = Build();

        Assert.Empty(ProductionConfigurationCheck.Problems(configuration));
        Assert.Empty(ProductionConfigurationCheck.Warnings(configuration));
    }

    [Fact]
    public void Short_or_missing_signing_keys_are_problems()
    {
        var configuration = Build(
            ("SsoToken:SigningKey", "pendek"),
            ("ServiceAccessToken:SigningKey", null)
        );

        var problems = ProductionConfigurationCheck.Problems(configuration);

        Assert.Contains(problems, item => item.StartsWith("SsoToken:SigningKey"));
        Assert.Contains(
            problems,
            item => item.StartsWith("ServiceAccessToken:SigningKey")
        );
    }

    [Fact]
    public void Identical_signing_keys_are_a_problem()
    {
        var key = new string('c', 48);
        var configuration = Build(
            ("SsoToken:SigningKey", key),
            ("ServiceAccessToken:SigningKey", key)
        );

        Assert.Contains(
            ProductionConfigurationCheck.Problems(configuration),
            item => item.Contains("harus berbeda")
        );
    }

    [Theory]
    [InlineData("*")]
    [InlineData("localhost;127.0.0.1;[::1]")]
    [InlineData("")]
    public void Unsafe_allowed_hosts_are_a_problem(string hosts)
    {
        var configuration = Build(("AllowedHosts", hosts));

        Assert.Contains(
            ProductionConfigurationCheck.Problems(configuration),
            item => item.StartsWith("AllowedHosts")
        );
    }

    [Theory]
    [InlineData("http://sso.example.com")]
    [InlineData("https://localhost:3000")]
    public void Unsafe_cors_origins_are_a_problem(string origin)
    {
        var configuration = Build(("Cors:AllowedOrigins:0", origin));

        Assert.Contains(
            ProductionConfigurationCheck.Problems(configuration),
            item => item.StartsWith("Cors:AllowedOrigins")
        );
    }

    [Fact]
    public void Missing_proxies_and_leftover_bootstrap_are_warnings()
    {
        var configuration = Build(
            ("ForwardedHeaders:KnownProxies:0", null),
            ("Bootstrap:Password", "rahasia")
        );

        var warnings = ProductionConfigurationCheck.Warnings(configuration);

        Assert.Contains(warnings, item => item.StartsWith("ForwardedHeaders"));
        Assert.Contains(warnings, item => item.StartsWith("Pengaturan Bootstrap"));
    }
}
