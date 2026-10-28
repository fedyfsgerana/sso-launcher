namespace SsoLauncher.Application.Abstractions.Auditing;

public interface IAuditContextAccessor
{
    AuditContext Current { get; }
}