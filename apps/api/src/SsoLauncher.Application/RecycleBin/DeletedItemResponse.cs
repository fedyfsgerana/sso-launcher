namespace SsoLauncher.Application.RecycleBin;

public sealed record DeletedItemResponse(
    long Id,
    string Name,
    string Detail,
    DateTimeOffset DeletedAt,
    string? DeletedByName = null,
    string? DeleteReason = null,
    string? Icon = null,
    string? Color = null
);
