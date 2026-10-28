#nullable enable

namespace SsoLauncher.Application.Applications.Shared;

public static class LaunchUrlRules
{
    public static bool IsValid(string? value)
    {
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) ||
            !string.IsNullOrEmpty(uri.UserInfo))
        {
            return false;
        }

        if (uri.Scheme == Uri.UriSchemeHttps)
        {
            return true;
        }

        return uri.Scheme == Uri.UriSchemeHttp && uri.IsLoopback;
    }
}
