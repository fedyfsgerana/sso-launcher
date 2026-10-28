namespace SsoLauncher.Application.Users.GetUsers;

public sealed record UserGroupRef(
    long Id,
    string Name
);

public sealed record UserResponse(
    long Id,
    string Name,
    string Email,
    string? EmployeeNumber,
    string? Department,
    string? DepartemenCode,
    string? JobTitle,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<UserGroupRef> Groups
);
