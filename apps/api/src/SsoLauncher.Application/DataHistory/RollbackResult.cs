namespace SsoLauncher.Application.DataHistory;

public enum RollbackResult
{
    RolledBack,
    NotFound,
    VersionNotFound,
    Unsupported,
    DeletedVersion,
    Conflict
}