namespace SsoLauncher.Application.Abstractions.Security;

public interface ICsrfTokenService
{
    string Generate();

    bool Validate(
        string? cookieToken,
        string? headerToken
    );
}