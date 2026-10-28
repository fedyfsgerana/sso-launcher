#nullable enable

namespace SsoLauncher.Application.Users.CreateUser;

public sealed record CreateUserRequest(
    string Name,
    string Email,
    string Password,
    string? EmployeeNumber,
    string Department,
    string? JobTitle,
    IReadOnlyList<long>? GroupIds
);
