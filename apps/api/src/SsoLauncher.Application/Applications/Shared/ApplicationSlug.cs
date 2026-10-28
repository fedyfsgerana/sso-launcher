using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace SsoLauncher.Application.Applications.Shared;

public static partial class ApplicationSlug
{
    public const int MaximumLength = 60;

    public static string Normalize(string value)
    {
        var text = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(text.Length);

        foreach (var character in text)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) ==
                UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            if (char.IsAsciiLetterLower(character) || char.IsAsciiDigit(character))
            {
                builder.Append(character);
                continue;
            }

            builder.Append('-');
        }

        var slug = SeparatorPattern()
            .Replace(builder.ToString(), "-")
            .Trim('-');

        return slug.Length > MaximumLength
            ? slug[..MaximumLength].Trim('-')
            : slug;
    }

    public static bool IsValid(string value)
    {
        return value.Length is > 0 and <= MaximumLength &&
               SlugPattern().IsMatch(value);
    }

    [GeneratedRegex("-{2,}")]
    private static partial Regex SeparatorPattern();

    [GeneratedRegex("^[a-z0-9]+(-[a-z0-9]+)*$")]
    private static partial Regex SlugPattern();
}
