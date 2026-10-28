namespace SsoLauncher.Application.Auth.ChangePassword;

public enum ChangePasswordResult
{
    Changed,
    InvalidCurrentPassword,
    WeakPassword,
    NotFound
}