namespace SsoLauncher.Application.Sso.SignOut;

public sealed record SignOutApplicationResponse(
    long ApplicationId,
    string Name,
    string Slug
);
