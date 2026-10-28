namespace SsoLauncher.Infrastructure.Security;

public sealed class SsoTokenOptions
{
    public const string SectionName = "SsoToken";

    public string Issuer { get; set; } = "sso-launcher";

    public string SigningKey { get; set; } = string.Empty;

    public int LifetimeSeconds { get; set; } = 60;
}