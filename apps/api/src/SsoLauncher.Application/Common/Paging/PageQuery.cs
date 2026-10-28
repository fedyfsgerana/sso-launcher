#nullable enable

namespace SsoLauncher.Application.Common.Paging;

public static class PageQuery
{
    public const int DefaultPageSize = 10;
    public const int MaxPageSize = 100;

    public static int NormalizePage(int? page)
    {
        return page is null or < 1 ? 1 : page.Value;
    }

    public static int NormalizePageSize(int? pageSize)
    {
        return pageSize switch
        {
            null or < 1 => DefaultPageSize,
            > MaxPageSize => MaxPageSize,
            _ => pageSize.Value
        };
    }

    public static bool IsDescending(string? direction)
    {
        return string.Equals(direction, "desc", StringComparison.OrdinalIgnoreCase);
    }

    public static string? NormalizeSearch(string? search)
    {
        var value = search?.Trim().ToLowerInvariant();

        return string.IsNullOrEmpty(value) ? null : value;
    }
}
