namespace SsoLauncher.Infrastructure.Security;

public sealed class ServiceAccessTokenOptions
{
    public const string SectionName =
        "ServiceAccessToken";

    public string Issuer { get; set; } =
        "sso-launcher";

    public string SigningKey { get; set; } =
        string.Empty;

    public int LifetimeSeconds { get; set; } =
        300;
}