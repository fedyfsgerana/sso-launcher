using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using SsoLauncher.Application.Abstractions.Security;

namespace SsoLauncher.Infrastructure.Security;

public sealed class ServiceAccessTokenService(
    IOptions<ServiceAccessTokenOptions> options)
    : IServiceAccessTokenService
{
    private readonly ServiceAccessTokenOptions _options =
        options.Value;

    public string Generate(
        long applicationId,
        string clientId,
        string scope,
        DateTimeOffset expiresAt)
    {
        EnsureSigningKey();

        var payload = new TokenPayload(
            applicationId,
            clientId,
            scope,
            _options.Issuer,
            expiresAt.ToUnixTimeSeconds()
        );

        var encodedPayload =
            Base64UrlEncode(
                JsonSerializer.SerializeToUtf8Bytes(
                    payload
                )
            );

        var encodedSignature =
            Base64UrlEncode(
                Sign(encodedPayload)
            );

        return $"{encodedPayload}.{encodedSignature}";
    }

    public ServiceAccessTokenValidationResult? Validate(
        string token)
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
            suppliedSignature =
                Base64UrlDecode(parts[1]);
        }
        catch (FormatException)
        {
            return null;
        }

        var expectedSignature =
            Sign(parts[0]);

        if (!CryptographicOperations.FixedTimeEquals(
                suppliedSignature,
                expectedSignature))
        {
            return null;
        }

        TokenPayload? payload;

        try
        {
            payload =
                JsonSerializer.Deserialize<TokenPayload>(
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
            payload.ApplicationId <= 0 ||
            string.IsNullOrWhiteSpace(payload.ClientId) ||
            string.IsNullOrWhiteSpace(payload.Scope) ||
            !string.Equals(
                payload.Issuer,
                _options.Issuer,
                StringComparison.Ordinal) ||
            payload.ExpiresAt <=
                DateTimeOffset.UtcNow.ToUnixTimeSeconds())
        {
            return null;
        }

        return new ServiceAccessTokenValidationResult(
            payload.ApplicationId,
            payload.ClientId,
            payload.Scope,
            DateTimeOffset.FromUnixTimeSeconds(
                payload.ExpiresAt
            )
        );
    }

    private byte[] Sign(string payload)
    {
        using var hmac =
            new HMACSHA256(
                Encoding.UTF8.GetBytes(
                    _options.SigningKey
                )
            );

        return hmac.ComputeHash(
            Encoding.UTF8.GetBytes(payload)
        );
    }

    private void EnsureSigningKey()
    {
        if (string.IsNullOrWhiteSpace(
                _options.SigningKey))
        {
            throw new InvalidOperationException(
                "Service access token signing key is not configured."
            );
        }
    }

    private static string Base64UrlEncode(
        byte[] value)
    {
        return Convert
            .ToBase64String(value)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private static byte[] Base64UrlDecode(
        string value)
    {
        var normalized = value
            .Replace('-', '+')
            .Replace('_', '/');

        normalized +=
            (normalized.Length % 4) switch
            {
                2 => "==",
                3 => "=",
                _ => string.Empty
            };

        return Convert.FromBase64String(
            normalized
        );
    }

    private sealed record TokenPayload(
        [property: JsonPropertyName("application_id")]
        long ApplicationId,
        [property: JsonPropertyName("client_id")]
        string ClientId,
        [property: JsonPropertyName("scope")]
        string Scope,
        [property: JsonPropertyName("iss")]
        string Issuer,
        [property: JsonPropertyName("exp")]
        long ExpiresAt
    );
}
