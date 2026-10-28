using System.Text.RegularExpressions;

namespace SsoLauncher.Application.Users;

public static partial class EmailRules
{
    public const int MaxLength = 254;

    public static string Normalize(string? value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }

    public static bool IsValid(string email)
    {
        return email.Length <= MaxLength &&
               Pattern().IsMatch(email);
    }

    [GeneratedRegex(@"^[a-z0-9._%+\-]+@[a-z0-9\-]+(\.[a-z0-9\-]+)*\.[a-z]{2,}$")]
    private static partial Regex Pattern();
}
