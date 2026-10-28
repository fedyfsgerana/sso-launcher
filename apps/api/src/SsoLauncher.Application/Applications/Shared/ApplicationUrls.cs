#nullable enable

namespace SsoLauncher.Application.Applications.Shared;

public sealed record ResolvedApplicationUrls(string AppUrl, string LaunchUrl);

public static class ApplicationUrls
{
    public const string DefaultCallbackPath = "/sso/callback";

    private const int MaxCallbackPathLength = 200;

    public static ResolvedApplicationUrls? Resolve(
        string? appUrl,
        string? launchUrl,
        string? callbackPath,
        bool usesSso)
    {
        if (string.IsNullOrWhiteSpace(appUrl))
        {
            var launch = launchUrl?.Trim();

            return LaunchUrlRules.IsValid(launch)
                ? new ResolvedApplicationUrls(OriginOf(launch!), launch!)
                : null;
        }

        var app = appUrl.Trim().TrimEnd('/');

        if (!LaunchUrlRules.IsValid(app) ||
            !Uri.TryCreate(app, UriKind.Absolute, out var uri) ||
            !string.IsNullOrEmpty(uri.Query) ||
            !string.IsNullOrEmpty(uri.Fragment))
        {
            return null;
        }

        if (!usesSso)
        {
            return new ResolvedApplicationUrls(app, app);
        }

        var path = NormalizeCallbackPath(callbackPath);

        return path is null ? null : new ResolvedApplicationUrls(app, app + path);
    }

    public static string? NormalizeCallbackPath(string? value)
    {
        var path = string.IsNullOrWhiteSpace(value) ? DefaultCallbackPath : value.Trim();

        if (path.Length > MaxCallbackPathLength ||
            path.Length < 2 ||
            !path.StartsWith('/') ||
            path.StartsWith("//", StringComparison.Ordinal) ||
            path.IndexOfAny(['?', '#', '\\', ' ']) >= 0)
        {
            return null;
        }

        return path;
    }

    public static string AppUrlOf(string storedAppUrl, string launchUrl)
    {
        return string.IsNullOrWhiteSpace(storedAppUrl) ? OriginOf(launchUrl) : storedAppUrl;
    }

    public static string? CallbackPathOf(string appUrl, string launchUrl, bool usesSso)
    {
        return usesSso &&
               launchUrl.Length > appUrl.Length &&
               launchUrl.StartsWith(appUrl, StringComparison.Ordinal)
            ? launchUrl[appUrl.Length..]
            : null;
    }

    private static string OriginOf(string url)
    {
        return Uri.TryCreate(url, UriKind.Absolute, out var uri)
            ? uri.GetLeftPart(UriPartial.Authority)
            : url;
    }
}
