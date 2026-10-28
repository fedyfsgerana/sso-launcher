#nullable enable

namespace SsoLauncher.Domain.Constants;

public sealed record Department(string Name, string Code);

public static class Departments
{
    public static readonly IReadOnlyList<Department> All =
    [
        new("Information Technology", "IT"),
        new("Human Resources", "HR"),
        new("Finance", "FIN"),
        new("General Affairs", "GA"),
        new("Operations", "OPS"),
        new("Marketing", "MKT"),
        new("Purchasing", "PUR"),
        new("Production", "PRD"),
        new("Quality Control", "QC"),
        new("Management", "MGT")
    ];

    public static string? CodeOf(string? name)
    {
        return All
            .FirstOrDefault(x => string.Equals(x.Name, name, StringComparison.Ordinal))
            ?.Code;
    }
}
