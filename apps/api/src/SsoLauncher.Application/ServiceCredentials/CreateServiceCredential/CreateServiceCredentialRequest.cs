namespace SsoLauncher.Application.ServiceCredentials.CreateServiceCredential;

public sealed record CreateServiceCredentialRequest(
    long ApplicationId,
    string Scope
);