namespace SsoLauncher.Application.Sso.Validate;

public sealed record ValidateSsoTokenResponse(
    long UserId,
    string Name,
    string Email,
    string? EmployeeNumber,
    string? Department,
    string? DepartemenCode,
    string? JobTitle,
    long ApplicationId,
    string ApplicationSlug,
    IReadOnlyList<string> Groups,
    DateTimeOffset ExpiresAt
);
