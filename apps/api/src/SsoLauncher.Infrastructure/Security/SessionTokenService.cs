using System.Security.Cryptography;
using System.Text;
using SsoLauncher.Application.Abstractions.Security;

namespace SsoLauncher.Infrastructure.Security;

public sealed class SessionTokenService : ISessionTokenService
{
    private const int TokenSize = 32;

    public string Generate()
    {
        return Convert.ToBase64String(
            RandomNumberGenerator.GetBytes(TokenSize)
        );
    }

    public string Hash(string token)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(token);

        var bytes = SHA256.HashData(
            Encoding.UTF8.GetBytes(token)
        );

        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}