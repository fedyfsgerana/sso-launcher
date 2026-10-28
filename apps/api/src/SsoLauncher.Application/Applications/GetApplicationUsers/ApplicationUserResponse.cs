namespace SsoLauncher.Application.Applications.GetApplicationUsers;

public sealed record ApplicationUserResponse(
    long UserId,
    string Name,
    string Email,
    string? Department,
    string? DepartemenCode,
    string? JobTitle,
    bool IsActive,
    IReadOnlyList<string> GroupNames
);
