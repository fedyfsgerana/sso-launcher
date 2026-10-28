namespace SsoLauncher.Application.Auth.Session;

public sealed record SessionUser(
    long UserId,
    string Name,
    string Email,
    string? Department,
    string? DepartemenCode,
    string? JobTitle,
    DateTimeOffset ExpiresAt
);
