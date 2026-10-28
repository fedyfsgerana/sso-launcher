using Microsoft.Extensions.DependencyInjection;
using SsoLauncher.Application.Account;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Activities.ClearActivities;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.GetAuditLogs;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Application.RecycleBin;
using SsoLauncher.Application.Activities.DeleteActivity;
using SsoLauncher.Application.Activities.GetActivities;
using SsoLauncher.Application.Activities.GetRecentActions;
using SsoLauncher.Application.Activities.RecordActivity;
using SsoLauncher.Application.Applications.CreateApplication;
using SsoLauncher.Application.Applications.DeleteApplication;
using SsoLauncher.Application.Applications.GetApplications;
using SsoLauncher.Application.Applications.GetApplicationCatalog;
using SsoLauncher.Application.Applications.GetApplicationUsers;
using SsoLauncher.Application.Applications.GetMyApplications;
using SsoLauncher.Application.Applications.UpdateApplication;
using SsoLauncher.Application.Auth.ChangePassword;
using SsoLauncher.Application.Auth.Login;
using SsoLauncher.Application.Auth.Logout;
using SsoLauncher.Application.Auth.Session;
using SsoLauncher.Application.DataHistory;
using SsoLauncher.Application.Directory;
using SsoLauncher.Application.Organization;
using SsoLauncher.Application.Notifications;
using SsoLauncher.Application.Overview;
using SsoLauncher.Application.Favorites.AddFavorite;
using SsoLauncher.Application.Favorites.GetFavorites;
using SsoLauncher.Application.Favorites.RemoveFavorite;
using SsoLauncher.Application.PortalMenus.CreatePortalMenu;
using SsoLauncher.Application.PortalMenus.DeletePortalMenu;
using SsoLauncher.Application.PortalMenus.GetMyMenus;
using SsoLauncher.Application.PortalMenus.GetPortalMenus;
using SsoLauncher.Application.PortalMenus.ReorderPortalMenus;
using SsoLauncher.Application.PortalMenus.SetMenuGroups;
using SsoLauncher.Application.PortalMenus.SetMenuMaintenance;
using SsoLauncher.Application.PortalMenus.UpdatePortalMenu;
using SsoLauncher.Application.ServiceCredentials.CreateServiceCredential;
using SsoLauncher.Application.ServiceCredentials.GetServiceCredentials;
using SsoLauncher.Application.ServiceCredentials.IntegrationPackage;
using SsoLauncher.Application.ServiceCredentials.IssueServiceAccessToken;
using SsoLauncher.Application.ServiceCredentials.DeleteServiceCredential;
using SsoLauncher.Application.ServiceCredentials.DiscardServiceCredential;
using SsoLauncher.Application.ServiceCredentials.RevokeServiceCredential;
using SsoLauncher.Application.Sso.Launch;
using SsoLauncher.Application.Sso.SessionStatus;
using SsoLauncher.Application.Sso.SignOut;
using SsoLauncher.Application.Sso.Validate;
using SsoLauncher.Application.UserGroups.DeleteUserGroup;
using SsoLauncher.Application.UserGroups.DuplicateUserGroup;
using SsoLauncher.Application.UserGroups.GetUserGroupDetail;
using SsoLauncher.Application.UserGroups.GetUserGroups;
using SsoLauncher.Application.UserGroups.GroupNames;
using SsoLauncher.Application.UserGroups.ManageAccess;
using SsoLauncher.Application.UserGroups.ManageMembers;
using SsoLauncher.Application.UserGroups.ManageMenuAccess;
using SsoLauncher.Application.UserGroups.SaveUserGroup;
using SsoLauncher.Application.Users.CreateUser;
using SsoLauncher.Application.Users.DeleteUser;
using SsoLauncher.Application.Users.Security;
using SsoLauncher.Application.Users.GetUsers;
using SsoLauncher.Application.Users.UpdateUser;

namespace SsoLauncher.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(
        this IServiceCollection services)
    {
        services.AddScoped<LoginService>();
        services.AddScoped<LoginLockoutService>();
        services.AddScoped<GetOverviewInsightsService>();
        services.AddScoped<Notifier>();
        services.AddScoped<NotificationService>();
        services.AddScoped<AccountSessionService>();
        services.AddScoped<NotificationSettingsService>();
        services.AddScoped<DirectoryService>();
        services.AddScoped<ChangePasswordService>();
        services.AddScoped<LogoutService>();
        services.AddScoped<SessionService>();

        services.AddScoped<GetMyApplicationsService>();
        services.AddScoped<GetApplicationCatalogService>();
        services.AddScoped<GetApplicationUsersService>();
        services.AddScoped<GetApplicationsService>();
        services.AddScoped<CreateApplicationService>();
        services.AddScoped<UpdateApplicationService>();


        services.AddScoped<CreateServiceCredentialService>();
        services.AddScoped<IntegrationPackageService>();
        services.AddScoped<DiscardServiceCredentialService>();
        services.AddScoped<GetServiceCredentialsService>();
        services.AddScoped<RevokeServiceCredentialService>();
        services.AddScoped<DeleteServiceCredentialService>();
        services.AddScoped<IssueServiceAccessTokenService>();

        services.AddScoped<LaunchApplicationService>();
        services.AddScoped<ValidateSsoTokenService>();
        services.AddScoped<SsoSessionStatusService>();
        services.AddScoped<SignOutApplicationService>();

        services.AddScoped<DeleteApplicationService>();

        services.AddScoped<GetMyMenusService>();
        services.AddScoped<GetPortalMenusService>();
        services.AddScoped<CreatePortalMenuService>();
        services.AddScoped<UpdatePortalMenuService>();
        services.AddScoped<DeletePortalMenuService>();
        services.AddScoped<ReorderPortalMenusService>();
        services.AddScoped<SetMenuGroupsService>();
        services.AddScoped<SetMenuMaintenanceService>();

        services.AddScoped<GetFavoritesService>();
        services.AddScoped<AddFavoriteService>();
        services.AddScoped<RemoveFavoriteService>();

        services.AddScoped<GetActivitiesService>();
        services.AddScoped<RecordActivityService>();
        services.AddScoped<GetRecentActionsService>();
        services.AddScoped<DeleteActivityService>();
        services.AddScoped<ClearActivitiesService>();

        services.AddScoped<GetUserGroupsService>();
        services.AddScoped<GroupNameOptionsService>();
        services.AddScoped<GetUserGroupDetailService>();
        services.AddScoped<CreateUserGroupService>();
        services.AddScoped<UpdateUserGroupService>();
        services.AddScoped<DeleteUserGroupService>();
        services.AddScoped<DuplicateUserGroupService>();
        services.AddScoped<SetGroupMembersService>();
        services.AddScoped<AddGroupMembersService>();
        services.AddScoped<SetGroupAccessService>();
        services.AddScoped<SetGroupMenuAccessService>();

        services.AddScoped<AuditScope>();
        services.AddScoped<AuditLogger>();
        services.AddScoped<AuditSnapshotReader>();
        services.AddScoped<GetAuditLogsService>();

        services.AddScoped<GetDeletedUsersService>();
        services.AddScoped<GetDeletedApplicationsService>();
        services.AddScoped<RestoreUserService>();
        services.AddScoped<RestoreApplicationService>();
        services.AddScoped<GetDeletedRecordsService>();
        services.AddScoped<RestoreRecordService>();

        services.AddScoped<GetDataVersionsService>();
        services.AddScoped<RollbackService>();

        services.AddScoped<GetUsersService>();
        services.AddScoped<DeleteUserService>();
        services.AddScoped<UserSecurityService>();
        services.AddScoped<CreateUserService>();
        services.AddScoped<UpdateUserService>();

        services.AddScoped<DepartmentCatalog>();

        return services;
    }
}
