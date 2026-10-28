namespace SsoLauncher.Domain.Entities;

public interface ISoftDeletable
{
    DateTimeOffset? DeletedAt { get; set; }

    long? DeletedById { get; set; }

    string? DeletedByName { get; set; }

    string? DeleteReason { get; set; }
}
