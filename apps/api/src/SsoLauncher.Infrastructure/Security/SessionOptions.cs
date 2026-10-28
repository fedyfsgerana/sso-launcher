namespace SsoLauncher.Infrastructure.Security;

public sealed class SessionOptions
{
    public const string SectionName = "Session";

    public int LifetimeHours { get; set; } = 8;

    public int IdleMinutes { get; set; } = 15;
}
