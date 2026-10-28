using System.Globalization;
using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Common.Text;

namespace SsoLauncher.Application.UserGroups.GroupNames;

public sealed class GroupNameOptionsService(
    ISsoLauncherDbContext dbContext)
{
    public const int MaxNameLength = 120;

    private static readonly StringComparer NameOrder =
        StringComparer.Create(CultureInfo.GetCultureInfo("id-ID"), true);

    public async Task<IReadOnlyList<GroupNameOption>> GetAsync(
        string? departemenCode,
        CancellationToken cancellationToken = default)
    {
        var code = string.IsNullOrWhiteSpace(departemenCode)
            ? null
            : departemenCode.Trim();

        if (code is null)
        {
            return [];
        }

        var titles = await JobTitlesAsync(code, cancellationToken);

        var groups = await dbContext.UserGroups
            .AsNoTracking()
            .Where(x => x.DepartemenCode == code)
            .Select(x => new { x.Id, x.Name })
            .ToListAsync(cancellationToken);

        var groupIdByName = groups
            .GroupBy(x => x.Name, StringComparer.Ordinal)
            .ToDictionary(x => x.Key, x => x.First().Id, StringComparer.Ordinal);

        return titles
            .Select(name => new GroupNameOption(
                name,
                groupIdByName.TryGetValue(name, out var groupId) ? groupId : null
            ))
            .ToList();
    }

    private async Task<IReadOnlyList<string>> JobTitlesAsync(
        string departemenCode,
        CancellationToken cancellationToken)
    {
        var titles = await dbContext.Users
            .AsNoTracking()
            .Where(x =>
                x.DepartemenCode == departemenCode &&
                x.JobTitle != null &&
                x.JobTitle != string.Empty)
            .Select(x => x.JobTitle!)
            .Distinct()
            .ToListAsync(cancellationToken);

        return titles
            .Select(TextFormat.Title)
            .Where(x => x.Length is > 0 and <= MaxNameLength)
            .Distinct(StringComparer.Ordinal)
            .Order(NameOrder)
            .ToList();
    }
}
