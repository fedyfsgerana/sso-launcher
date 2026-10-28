namespace SsoLauncher.Infrastructure.Persistence.Maintenance;

public sealed class DataRetentionOptions
{
    public const string SectionName = "DataRetention";

    public bool Enabled { get; set; } = true;

    public int AuditLogMonths { get; set; } = 36;

    public int DataVersionMonths { get; set; } = 36;

    public int ActivityMonths { get; set; } = 6;

    public int NotificationMonths { get; set; } = 3;

    public int BatchSize { get; set; } = 5000;

    public int MaxBatchesPerRun { get; set; } = 200;

    public int IntervalHours { get; set; } = 24;
}
