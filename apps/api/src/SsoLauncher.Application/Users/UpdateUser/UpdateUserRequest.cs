#nullable enable

namespace SsoLauncher.Application.Users.UpdateUser;

public sealed record UpdateUserRequest(
    string Name,
    string Email,
    string? EmployeeNumber,
    string? Department,
    string? JobTitle,
    bool IsActive
);
