namespace SsoLauncher.Application.ServiceCredentials;

public static class ServiceScopes
{
    public const string SsoValidate =
        "sso.validate";

    public const string UsersRead =
        "users.read";

    private static readonly IReadOnlySet<string>
        SupportedScopes =
            new HashSet<string>(
                StringComparer.Ordinal
            )
            {
                SsoValidate,
                UsersRead
            };

    public static bool IsSupported(
        string scope)
    {
        return SupportedScopes.Contains(scope);
    }

    public static bool Contains(
        string scope,
        string requiredScope)
    {
        if (string.IsNullOrWhiteSpace(scope) ||
            !IsSupported(requiredScope))
        {
            return false;
        }

        return scope
            .Split(
                ' ',
                StringSplitOptions.RemoveEmptyEntries |
                StringSplitOptions.TrimEntries
            )
            .Contains(
                requiredScope,
                StringComparer.Ordinal
            );
    }
}
