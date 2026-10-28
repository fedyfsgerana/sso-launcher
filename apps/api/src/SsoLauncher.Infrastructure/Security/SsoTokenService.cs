using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using SsoLauncher.Application.Abstractions.Security;

namespace SsoLauncher.Infrastructure.Security;

public sealed class SsoTokenService(
    IOptions<SsoTokenOptions> options) : ISsoTokenService
{
    private readonly SsoTokenOptions _options = options.Value;

    public string Generate(
        long userId,
        long applicationId,
        DateTimeOffset expiresAt)
    {
        EnsureSigningKey();

        var payload = new TokenPayload(
            userId,
            applicationId,
            _options.Issuer,
            expiresAt.ToUnixTimeSeconds(),
            Convert.ToHexString(
                RandomNumberGenerator.GetBytes(16)
            ).ToLowerInvariant()
        );

        var encodedPayload = Base64UrlEncode(
            JsonSerializer.SerializeToUtf8Bytes(payload)
        );

        var encodedSignature = Base64UrlEncode(
            Sign(encodedPayload)
        );

        return $"{encodedPayload}.{encodedSignature}";
    }

    public SsoTokenValidationResult? Validate(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        EnsureSigningKey();

        var parts = token.Split('.');

        if (parts.Length != 2)
        {
            return null;
        }

        byte[] suppliedSignature;

        try
        {
            suppliedSignature = Base64UrlDecode(parts[1]);
        }
        catch (FormatException)
        {
            return null;
        }

        var expectedSignature = Sign(parts[0]);

        if (!CryptographicOperations.FixedTimeEquals(
                suppliedSignature,
                expectedSignature))
        {
            return null;
        }

        TokenPayload? payload;

        try
        {
            payload = JsonSerializer.Deserialize<TokenPayload>(
                Base64UrlDecode(parts[0])
            );
        }
        catch (JsonException)
        {
            return null;
        }
        catch (FormatException)
        {
            return null;
        }

        if (payload is null ||
            payload.UserId <= 0 ||
            payload.ApplicationId <= 0 ||
            !string.Equals(
                payload.Issuer,
                _options.Issuer,
                StringComparison.Ordinal) ||
            payload.ExpiresAt <= DateTimeOffset.UtcNow.ToUnixTimeSeconds() ||
            string.IsNullOrWhiteSpace(payload.TokenId))
        {
            return null;
        }

        return new SsoTokenValidationResult(
            payload.UserId,
            payload.ApplicationId,
            DateTimeOffset.FromUnixTimeSeconds(payload.ExpiresAt),
            payload.TokenId
        );
    }

    private byte[] Sign(string payload)
    {
        using var hmac = new HMACSHA256(
            Encoding.UTF8.GetBytes(_options.SigningKey)
        );

        return hmac.ComputeHash(
            Encoding.UTF8.GetBytes(payload)
        );
    }

    private void EnsureSigningKey()
    {
        if (string.IsNullOrWhiteSpace(_options.SigningKey))
        {
            throw new InvalidOperationException(
                "SSO token signing key is not configured."
            );
        }
    }

    private static string Base64UrlEncode(byte[] value)
    {
        return Convert
            .ToBase64String(value)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private static byte[] Base64UrlDecode(string value)
    {
        var normalized = value
            .Replace('-', '+')
            .Replace('_', '/');

        normalized += (normalized.Length % 4) switch
        {
            2 => "==",
            3 => "=",
            _ => string.Empty
        };

        return Convert.FromBase64String(normalized);
    }

    private sealed record TokenPayload(
        [property: System.Text.Json.Serialization.JsonPropertyName("user_id")]
        long UserId,
        [property: System.Text.Json.Serialization.JsonPropertyName("application_id")]
        long ApplicationId,
        [property: System.Text.Json.Serialization.JsonPropertyName("iss")]
        string Issuer,
        [property: System.Text.Json.Serialization.JsonPropertyName("exp")]
        long ExpiresAt,
        [property: System.Text.Json.Serialization.JsonPropertyName("jti")]
        string TokenId
    );
}
