namespace SsoLauncher.Application.Abstractions.Security;

public interface ISessionTokenService
{
    string Generate();

    string Hash(string token);
}