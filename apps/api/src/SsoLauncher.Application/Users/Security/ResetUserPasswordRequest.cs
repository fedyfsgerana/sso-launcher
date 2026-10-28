namespace SsoLauncher.Application.Users.Security;

public sealed record ResetUserPasswordRequest(
    string NewPassword
);