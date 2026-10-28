namespace SsoLauncher.Application.ServiceCredentials.IssueServiceAccessToken;

public sealed record IssueServiceAccessTokenRequest(
    string ClientId,
    string ClientSecret
);