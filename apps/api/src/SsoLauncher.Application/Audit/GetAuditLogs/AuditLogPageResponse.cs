namespace SsoLauncher.Application.Audit.GetAuditLogs;

public sealed record AuditLogPageResponse(
    IReadOnlyList<AuditLogResponse> Items,
    int Total,
    int Page,
    int PageSize
);