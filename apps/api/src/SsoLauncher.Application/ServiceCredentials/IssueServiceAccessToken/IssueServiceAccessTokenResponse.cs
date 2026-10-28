namespace SsoLauncher.Application.ServiceCredentials.IssueServiceAccessToken;

public sealed record IssueServiceAccessTokenResponse(
    string AccessToken,
    string TokenType,
    int ExpiresIn,
    string Scope
);