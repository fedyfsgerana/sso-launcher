namespace SsoLauncher.Application.DataHistory;

public sealed record RollbackRequest(
    int Version,
    string? Reason
);