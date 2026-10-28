namespace SsoLauncher.Application.ServiceCredentials.CreateServiceCredential;

public sealed record CreateServiceCredentialResponse(
    long Id,
    long ApplicationId,
    string ClientId,
    string ClientSecret,
    string Scope,
    DateTimeOffset CreatedAt
);