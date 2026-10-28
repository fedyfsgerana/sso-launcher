namespace SsoLauncher.Application.Sso.Launch;

public enum LaunchApplicationOutcome
{
    Launched,
    Unavailable,
    SsoNotReady
}

public sealed record LaunchApplicationResult(
    LaunchApplicationOutcome Outcome,
    LaunchApplicationResponse? Response = null
)
{
    public static LaunchApplicationResult Unavailable { get; } =
        new(LaunchApplicationOutcome.Unavailable);

    public static LaunchApplicationResult SsoNotReady { get; } =
        new(LaunchApplicationOutcome.SsoNotReady);

    public static LaunchApplicationResult Launched(
        LaunchApplicationResponse response) =>
        new(LaunchApplicationOutcome.Launched, response);
}
