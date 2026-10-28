namespace SsoLauncher.Application.Abstractions.Security;

public interface IServiceAccessTokenService
{
    string Generate(
        long applicationId,
        string clientId,
        string scope,
        DateTimeOffset expiresAt
    );

    ServiceAccessTokenValidationResult? Validate(
        string token
    );
}

public sealed record ServiceAccessTokenValidationResult(
    long ApplicationId,
    string ClientId,
    string Scope,
    DateTimeOffset ExpiresAt
);