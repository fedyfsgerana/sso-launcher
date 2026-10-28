using SsoLauncher.Application.Common.Text;

namespace SsoLauncher.Application.Abstractions.Auditing;

public sealed class AuditScope
{
    public long? ActorId { get; private set; }

    public string ActorName { get; private set; } = string.Empty;

    public string? DeleteReason { get; private set; }

    public void SetActor(long actorId, string actorName)
    {
        ActorId = actorId;
        ActorName = actorName;
    }

    public void SetDeleteReason(string? reason)
    {
        DeleteReason = TextFormat.SentenceOrNull(reason);
    }
}
