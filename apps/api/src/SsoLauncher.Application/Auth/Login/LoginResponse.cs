namespace SsoLauncher.Application.Auth.Login;

public sealed record LoginResponse(
    long UserId,
    string Name,
    string Email,
    string? Department,
    string? DepartemenCode,
    string? JobTitle,
    DateTimeOffset ExpiresAt
);
