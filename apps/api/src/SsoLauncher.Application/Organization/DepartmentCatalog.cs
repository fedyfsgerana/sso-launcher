using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Organization;

public sealed class DepartmentCatalog
{
    private static readonly DepartmentListResponse List = new(
        Departments.All
            .Select(x => new DepartmentOption(x.Name, x.Code))
            .ToList()
    );

    public Task<DepartmentListResponse> GetAsync(
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(List);
    }

    public Task<string?> CodeOfAsync(
        string? name,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Departments.CodeOf(name));
    }

    public Task<bool> IsApplicationCategoryAsync(
        string? category,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(
            string.Equals(category, ApplicationCategories.Other, StringComparison.Ordinal) ||
            Departments.CodeOf(category) is not null
        );
    }
}
