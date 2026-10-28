using System.Globalization;
using System.Text.RegularExpressions;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Common.Text;

public static partial class TextFormat
{
    private const int ShortAcronymLength = 4;

    private static readonly CultureInfo Culture = CultureInfo.InvariantCulture;

    public static string Title(string? value)
    {
        var text = Collapse(value);

        if (text.Length == 0)
        {
            return text;
        }

        var allCaps = IsAllCaps(text);

        return string.Join(
            ' ',
            text.Split(' ').Select(word => MapCore(word, core => TitleCore(core, allCaps)))
        );
    }

    public static string? TitleOrNull(string? value)
    {
        var text = Title(value);

        return text.Length == 0 ? null : text;
    }

    public static string Sentence(string? value)
    {
        var text = Collapse(value);

        if (text.Length == 0)
        {
            return text;
        }

        if (IsAllCaps(text))
        {
            text = string.Join(
                ' ',
                text.Split(' ').Select(word => MapCore(word, LowerCore))
            );
        }

        var index = FirstLetterIndex(text);

        return index < 0
            ? text
            : text[..index] + char.ToUpper(text[index], Culture) + text[(index + 1)..];
    }

    public static string? SentenceOrNull(string? value)
    {
        var text = Sentence(value);

        return text.Length == 0 ? null : text;
    }

    private static string TitleCore(string core, bool allCaps)
    {
        if (TextAcronyms.Contains(core))
        {
            return core.ToUpper(Culture);
        }

        if (core.Any(char.IsDigit))
        {
            return core;
        }

        if (core.Contains('-') || core.Contains('/'))
        {
            return string.Concat(
                SeparatorPattern()
                    .Split(core)
                    .Select(part => part is "-" or "/" || part.Length == 0
                        ? part
                        : TitleCore(part, allCaps))
            );
        }

        if (!allCaps &&
            core.Length is >= 2 and <= ShortAcronymLength &&
            core.All(char.IsUpper))
        {
            return core;
        }

        return char.ToUpper(core[0], Culture) + core[1..].ToLower(Culture);
    }

    private static string LowerCore(string core)
    {
        return core
            .Split('-')
            .Select(part => TextAcronyms.Contains(part)
                ? part.ToUpper(Culture)
                : part.ToLower(Culture))
            .Aggregate((left, right) => $"{left}-{right}");
    }

    private static string MapCore(string word, Func<string, string> map)
    {
        var start = 0;

        while (start < word.Length && !char.IsLetterOrDigit(word[start]))
        {
            start++;
        }

        var end = word.Length;

        while (end > start && !char.IsLetterOrDigit(word[end - 1]))
        {
            end--;
        }

        return start >= end
            ? word
            : word[..start] + map(word[start..end]) + word[end..];
    }

    private static string Collapse(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? string.Empty
            : WhitespacePattern().Replace(value.Trim(), " ");
    }

    private static bool IsAllCaps(string text)
    {
        return text.Any(char.IsLetter) && !text.Any(char.IsLower);
    }

    private static int FirstLetterIndex(string text)
    {
        for (var index = 0; index < text.Length; index++)
        {
            if (char.IsLetter(text[index]))
            {
                return index;
            }
        }

        return -1;
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespacePattern();

    [GeneratedRegex("([-/])")]
    private static partial Regex SeparatorPattern();
}
