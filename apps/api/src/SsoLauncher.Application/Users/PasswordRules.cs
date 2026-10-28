#nullable enable

namespace SsoLauncher.Application.Users;

public static class PasswordRules
{
    public const int MinimumLength = 12;
    public const bool RequiresMixedCharacters = true;

    public static bool IsValid(string? password)
    {
        if (string.IsNullOrWhiteSpace(password) ||
            password.Length < MinimumLength)
        {
            return false;
        }

        return password.Any(char.IsUpper) &&
               password.Any(char.IsLower) &&
               password.Any(char.IsDigit) &&
               password.Any(x => !char.IsLetterOrDigit(x) && !char.IsWhiteSpace(x));
    }
}
