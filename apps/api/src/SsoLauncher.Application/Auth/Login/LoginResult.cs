namespace SsoLauncher.Application.Auth.Login;

public enum LoginOutcome
{
    Succeeded,
    Rejected,
    LockedOut
}

public sealed record LoginResult(
    LoginOutcome Outcome,
    LoginResponse? Response = null,
    string? SessionToken = null,
    DateTimeOffset? LockedUntil = null
);