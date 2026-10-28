namespace SsoLauncher.Application.Auth.ChangePassword;

public sealed record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword
);