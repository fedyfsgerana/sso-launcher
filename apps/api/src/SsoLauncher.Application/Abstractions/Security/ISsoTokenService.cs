namespace SsoLauncher.Application.Abstractions.Security;

public interface ISsoTokenService
{
    string Generate(
        long userId,
        long applicationId,
        DateTimeOffset expiresAt
    );

    SsoTokenValidationResult? Validate(string token);
}