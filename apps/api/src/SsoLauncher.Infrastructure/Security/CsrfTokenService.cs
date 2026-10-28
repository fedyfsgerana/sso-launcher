using System.Security.Cryptography;
using SsoLauncher.Application.Abstractions.Security;

namespace SsoLauncher.Infrastructure.Security;

public sealed class CsrfTokenService : ICsrfTokenService
{
    public string Generate()
    {
        return Convert.ToBase64String(
            RandomNumberGenerator.GetBytes(32)
        );
    }

    public bool Validate(
        string? cookieToken,
        string? headerToken)
    {
        if (string.IsNullOrWhiteSpace(cookieToken) ||
            string.IsNullOrWhiteSpace(headerToken))
        {
            return false;
        }

        byte[] cookieBytes;
        byte[] headerBytes;

        try
        {
            cookieBytes = Convert.FromBase64String(cookieToken);
            headerBytes = Convert.FromBase64String(headerToken);
        }
        catch (FormatException)
        {
            return false;
        }

        return cookieBytes.Length == headerBytes.Length &&
               CryptographicOperations.FixedTimeEquals(
                   cookieBytes,
                   headerBytes
               );
    }
}