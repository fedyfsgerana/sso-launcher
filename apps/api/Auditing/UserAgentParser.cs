using System.Text.RegularExpressions;

namespace SsoLauncher.Api.Auditing;

public static class UserAgentParser
{
    private const RegexOptions Options =
        RegexOptions.IgnoreCase |
        RegexOptions.CultureInvariant |
        RegexOptions.Compiled;

    private static readonly (string Name, Regex Pattern)[] Browsers =
    [
        ("Edge", new Regex(@"Edg(?:e|A|iOS)?/([\d.]+)", Options)),
        ("Opera", new Regex(@"(?:OPR|Opera)/([\d.]+)", Options)),
        ("Samsung Internet", new Regex(@"SamsungBrowser/([\d.]+)", Options)),
        ("Vivaldi", new Regex(@"Vivaldi/([\d.]+)", Options)),
        ("Yandex", new Regex(@"YaBrowser/([\d.]+)", Options)),
        ("Firefox", new Regex(@"(?:Firefox|FxiOS)/([\d.]+)", Options)),
        ("Chrome", new Regex(@"(?:Chrome|CriOS)/([\d.]+)", Options)),
        ("Safari", new Regex(@"Version/([\d.]+).*Safari/", Options)),
        ("Internet Explorer", new Regex(@"(?:MSIE |Trident/.*rv:)([\d.]+)", Options)),
        ("Postman", new Regex(@"PostmanRuntime/([\d.]+)", Options)),
        ("curl", new Regex(@"curl/([\d.]+)", Options))
    ];

    private static readonly Regex BrandPattern =
        new("\"([^\"]+)\";v=\"([^\"]+)\"", Options);

    private static readonly Regex AndroidPattern =
        new(@"Android ([\d.]+)", Options);

    private static readonly Regex IosPattern =
        new(@"(?:iPhone|CPU) OS ([\d_]+)", Options);

    private static readonly Regex MacPattern =
        new(@"Mac OS X ([\d_.]+)", Options);

    private static readonly Regex WindowsPattern =
        new(@"Windows NT ([\d.]+)", Options);

    public static UserAgentInfo Parse(
        string? userAgent,
        IHeaderDictionary headers)
    {
        var agent = userAgent ?? string.Empty;

        var (browser, version) = ParseBrowser(agent, headers);

        return new UserAgentInfo(
            browser,
            version,
            ParseOperatingSystem(agent, headers),
            ParseDeviceType(agent, headers)
        );
    }

    private static (string? Browser, string? Version) ParseBrowser(
        string agent,
        IHeaderDictionary headers)
    {
        var fromHints = ParseBrandHints(
            headers["Sec-CH-UA-Full-Version-List"].ToString()
        ) ?? ParseBrandHints(
            headers["Sec-CH-UA"].ToString()
        );

        string? fallbackName = null;
        string? fallbackVersion = null;

        foreach (var (name, pattern) in Browsers)
        {
            var match = pattern.Match(agent);

            if (match.Success)
            {
                fallbackName = name;
                fallbackVersion = match.Groups[1].Value;
                break;
            }
        }

        if (fromHints is null)
        {
            return (fallbackName, fallbackVersion);
        }

        var hintVersion = fromHints.Value.Version;

        if (fallbackName == fromHints.Value.Name &&
            fallbackVersion is not null &&
            fallbackVersion.Length > hintVersion.Length)
        {
            hintVersion = fallbackVersion;
        }

        return (fromHints.Value.Name, hintVersion);
    }

    private static (string Name, string Version)? ParseBrandHints(
        string header)
    {
        if (string.IsNullOrWhiteSpace(header))
        {
            return null;
        }

        (string Name, string Version)? chromium = null;

        foreach (Match match in BrandPattern.Matches(header))
        {
            var brand = match.Groups[1].Value;
            var version = match.Groups[2].Value;

            if (brand.Contains("Not", StringComparison.OrdinalIgnoreCase) &&
                brand.Contains("Brand", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (brand.Equals("Chromium", StringComparison.OrdinalIgnoreCase))
            {
                chromium = ("Chromium", version);
                continue;
            }

            return (NormalizeBrand(brand), version);
        }

        return chromium;
    }

    private static string NormalizeBrand(string brand)
    {
        return brand switch
        {
            "Google Chrome" => "Chrome",
            "Microsoft Edge" => "Edge",
            "Brave" => "Brave",
            _ => brand
        };
    }

    private static string? ParseOperatingSystem(
        string agent,
        IHeaderDictionary headers)
    {
        var platform = Unquote(headers["Sec-CH-UA-Platform"].ToString());
        var platformVersion = Unquote(
            headers["Sec-CH-UA-Platform-Version"].ToString()
        );

        if (platform == "Windows" && !string.IsNullOrEmpty(platformVersion))
        {
            var major = ParseMajor(platformVersion);

            if (major >= 13)
            {
                return "Windows 11";
            }

            if (major >= 1)
            {
                return "Windows 10";
            }
        }

        if (platform == "macOS" && !string.IsNullOrEmpty(platformVersion))
        {
            return $"macOS {platformVersion}";
        }

        var windows = WindowsPattern.Match(agent);

        if (windows.Success)
        {
            return windows.Groups[1].Value switch
            {
                "10.0" => "Windows 10/11",
                "6.3" => "Windows 8.1",
                "6.2" => "Windows 8",
                "6.1" => "Windows 7",
                _ => $"Windows NT {windows.Groups[1].Value}"
            };
        }

        var android = AndroidPattern.Match(agent);

        if (android.Success)
        {
            return $"Android {android.Groups[1].Value}";
        }

        var ios = IosPattern.Match(agent);

        if (ios.Success)
        {
            var name = agent.Contains("iPad", StringComparison.OrdinalIgnoreCase)
                ? "iPadOS"
                : "iOS";

            return $"{name} {ios.Groups[1].Value.Replace('_', '.')}";
        }

        if (agent.Contains("CrOS", StringComparison.OrdinalIgnoreCase))
        {
            return "ChromeOS";
        }

        var mac = MacPattern.Match(agent);

        if (mac.Success)
        {
            return "macOS";
        }

        if (agent.Contains("Linux", StringComparison.OrdinalIgnoreCase))
        {
            return "Linux";
        }

        return string.IsNullOrEmpty(platform)
            ? null
            : platform;
    }

    private static string ParseDeviceType(
        string agent,
        IHeaderDictionary headers)
    {
        if (headers["Sec-CH-UA-Mobile"].ToString() == "?1")
        {
            return "Mobile";
        }

        if (agent.Contains("iPad", StringComparison.OrdinalIgnoreCase) ||
            agent.Contains("Tablet", StringComparison.OrdinalIgnoreCase))
        {
            return "Tablet";
        }

        if (agent.Contains("Android", StringComparison.OrdinalIgnoreCase))
        {
            return agent.Contains("Mobile", StringComparison.OrdinalIgnoreCase)
                ? "Mobile"
                : "Tablet";
        }

        if (agent.Contains("Mobi", StringComparison.OrdinalIgnoreCase) ||
            agent.Contains("iPhone", StringComparison.OrdinalIgnoreCase))
        {
            return "Mobile";
        }

        if (string.IsNullOrWhiteSpace(agent) ||
            agent.Contains("PostmanRuntime", StringComparison.OrdinalIgnoreCase) ||
            agent.Contains("curl/", StringComparison.OrdinalIgnoreCase))
        {
            return "Other";
        }

        return "Desktop";
    }

    private static string Unquote(string value)
    {
        return value.Trim().Trim('"');
    }

    private static int ParseMajor(string version)
    {
        var dot = version.IndexOf('.');
        var head = dot < 0 ? version : version[..dot];

        return int.TryParse(head, out var major) ? major : 0;
    }
}