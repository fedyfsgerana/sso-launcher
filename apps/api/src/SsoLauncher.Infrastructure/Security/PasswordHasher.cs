using System.Security.Cryptography;
using SsoLauncher.Application.Abstractions.Security;

namespace SsoLauncher.Infrastructure.Security;

public sealed class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 600_000;

    private readonly Lazy<string> _dummyHash;

    public PasswordHasher()
    {
        _dummyHash = new Lazy<string>(
            () => Hash(Convert.ToBase64String(RandomNumberGenerator.GetBytes(24)))
        );
    }

    public string Hash(string password)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);

        var salt = RandomNumberGenerator.GetBytes(SaltSize);

        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            Iterations,
            HashAlgorithmName.SHA256,
            HashSize
        );

        return string.Join(
            '.',
            Iterations,
            Convert.ToBase64String(salt),
            Convert.ToBase64String(hash)
        );
    }

    public bool Verify(
        string password,
        string passwordHash
    )
    {
        if (string.IsNullOrWhiteSpace(password) ||
            string.IsNullOrWhiteSpace(passwordHash))
        {
            return false;
        }

        var parts = passwordHash.Split('.');

        if (parts.Length != 3 ||
            !int.TryParse(parts[0], out var iterations))
        {
            return false;
        }

        try
        {
            var salt = Convert.FromBase64String(parts[1]);
            var expectedHash = Convert.FromBase64String(parts[2]);

            var actualHash = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                iterations,
                HashAlgorithmName.SHA256,
                expectedHash.Length
            );

            return CryptographicOperations.FixedTimeEquals(
                actualHash,
                expectedHash
            );
        }
        catch (FormatException)
        {
            return false;
        }
    }

    public bool NeedsRehash(string passwordHash)
    {
        var parts = passwordHash.Split('.');

        return parts.Length != 3 ||
               !int.TryParse(parts[0], out var iterations) ||
               iterations < Iterations;
    }

    public void SimulateVerify(string password)
    {
        Verify(
            string.IsNullOrWhiteSpace(password) ? "-" : password,
            _dummyHash.Value
        );
    }
}
