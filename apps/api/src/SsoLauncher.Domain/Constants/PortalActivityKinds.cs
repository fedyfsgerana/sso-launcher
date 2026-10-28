namespace SsoLauncher.Domain.Constants;

public static class PortalActivityKinds
{
    public const string Application = "application";

    public static bool IsValid(string kind)
    {
        return kind == Application;
    }
}
