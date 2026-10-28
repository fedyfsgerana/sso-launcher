namespace SsoLauncher.Application.Organization;

public sealed record DepartmentListResponse(
    IReadOnlyList<DepartmentOption> Items
);
