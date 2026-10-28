namespace SsoLauncher.Application.Account;

public sealed record SecurityPolicyResponse(
    int IdleMinutes,
    int SessionHours,
    int MaxFailuresPerAddress,
    int MaxFailuresPerAccount,
    int LockoutMinutes,
    int PasswordMinimumLength,
    bool PasswordRequiresMixedCharacters
);
