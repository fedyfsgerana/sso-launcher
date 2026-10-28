namespace SsoLauncher.Domain.Constants;

public static class AuditActions
{
    public const string Create = "create";
    public const string Update = "update";
    public const string Delete = "delete";
    public const string Restore = "restore";
    public const string Rollback = "rollback";
    public const string Baseline = "baseline";
    public const string Grant = "grant";
    public const string Revoke = "revoke";
    public const string Login = "login";
    public const string LoginFailed = "login_failed";
    public const string Logout = "logout";
    public const string Launch = "launch";
    public const string FavoriteAdd = "favorite_add";
    public const string FavoriteRemove = "favorite_remove";
    public const string Lock = "lock";
    public const string Unlock = "unlock";

    public static readonly IReadOnlyList<string> All =
    [
        Create,
        Update,
        Delete,
        Restore,
        Rollback,
        Grant,
        Revoke,
        Login,
        LoginFailed,
        Logout,
        Launch,
        FavoriteAdd,
        FavoriteRemove,
        Lock,
        Unlock
    ];
}

public static class AuditTargets
{
    public const string User = "user";
    public const string UserGroup = "user_group";
    public const string Application = "application";
    public const string ApplicationMenu = "application_menu";
    public const string PortalMenu = "portal_menu";
    public const string Access = "access";
    public const string Password = "password";
    public const string Session = "session";
    public const string ServiceCredential = "service_credential";
    public const string Favorite = "favorite";
    public const string Activity = "activity";
}

public static class AuditOutcomes
{
    public const string Success = "success";
    public const string Failed = "failed";
}

public static class AuditModules
{
    public const string Users = "users";
    public const string Groups = "groups";
    public const string Applications = "applications";
    public const string Menus = "menus";
    public const string Access = "access";
    public const string Auth = "auth";
    public const string Portal = "portal";

    public static readonly IReadOnlyList<string> All =
    [
        Users,
        Groups,
        Applications,
        Menus,
        Access,
        Auth,
        Portal
    ];

    public static IReadOnlyList<string> TargetsFor(string module)
    {
        return module switch
        {
            Users => [AuditTargets.User, AuditTargets.Password],
            Groups => [AuditTargets.UserGroup],
            Applications =>
            [
                AuditTargets.Application,
                AuditTargets.ApplicationMenu,
                AuditTargets.ServiceCredential
            ],
            Menus => [AuditTargets.PortalMenu],
            Access => [AuditTargets.Access],
            Auth => [AuditTargets.Session],
            Portal => [AuditTargets.Favorite, AuditTargets.Activity],
            _ => []
        };
    }

    public static string ForTarget(string targetType)
    {
        return targetType switch
        {
            AuditTargets.User or AuditTargets.Password => Users,
            AuditTargets.UserGroup => Groups,
            AuditTargets.Application or
                AuditTargets.ApplicationMenu or
                AuditTargets.ServiceCredential => Applications,
            AuditTargets.PortalMenu => Menus,
            AuditTargets.Access => Access,
            AuditTargets.Session => Auth,
            _ => Portal
        };
    }
}