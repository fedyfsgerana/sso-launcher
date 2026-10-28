namespace SsoLauncher.Application.Directory;

public sealed record DirectoryUserResponse(
    long UserId,
    string Name,
    string Email,
    string? EmployeeNumber,
    string? Department,
    string? DepartemenCode,
    string? JobTitle,
    IReadOnlyList<string> Groups,
    DateTimeOffset UpdatedAt
);

public sealed record DirectoryUserListResponse(
    int Total,
    int Page,
    int PageSize,
    IReadOnlyList<DirectoryUserResponse> Items
);

public sealed record DirectoryUserStatusResponse(
    long UserId,
    bool IsActive,
    bool HasAccess,
    DirectoryUserResponse? User
);
