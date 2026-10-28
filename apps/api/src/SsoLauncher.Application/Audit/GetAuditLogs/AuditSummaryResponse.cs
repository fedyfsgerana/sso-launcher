namespace SsoLauncher.Application.Audit.GetAuditLogs;

public sealed record AuditSummaryResponse(
    int Today,
    int LastSevenDays,
    int DeletionsLastSevenDays,
    int FailedLastSevenDays
);

public sealed record AuditActorResponse(
    long ActorId,
    string Name
);