namespace SsoLauncher.Infrastructure.Security;

public sealed class LoginLockoutOptions
{
    public const string SectionName = "LoginLockout";

    public int MaxFailuresPerAddress { get; set; } = 5;

    public int MaxFailuresPerAccount { get; set; } = 20;

    public int WindowMinutes { get; set; } = 15;
}