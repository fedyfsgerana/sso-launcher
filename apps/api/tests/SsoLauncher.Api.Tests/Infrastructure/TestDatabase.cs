using System.Text.RegularExpressions;
using Npgsql;

namespace SsoLauncher.Api.Tests.Infrastructure;

public static partial class TestDatabase
{
    public const string ConnectionVariable = "SSO_LAUNCHER_TEST_DB_CONNECTION";

    public static string ResolveConnectionString()
    {
        var connectionString = Environment.GetEnvironmentVariable(ConnectionVariable);

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                $"Isi environment variable {ConnectionVariable} dengan koneksi ke database test, misalnya sso_launcher_test."
            );
        }

        var database = new NpgsqlConnectionStringBuilder(connectionString).Database;

        if (database is null || !TestDatabaseName().IsMatch(database))
        {
            throw new InvalidOperationException(
                $"Database test harus bernama huruf kecil dan diakhiri _test, sekarang '{database}'. Test menghapus seluruh isi database ini."
            );
        }

        return connectionString;
    }

    public static async Task RecreateAsync(
        string connectionString,
        CancellationToken cancellationToken)
    {
        var database = new NpgsqlConnectionStringBuilder(connectionString).Database!;

        var maintenance = new NpgsqlConnectionStringBuilder(connectionString)
        {
            Database = "postgres",
            Pooling = false
        };

        await using var connection = new NpgsqlConnection(maintenance.ConnectionString);
        await connection.OpenAsync(cancellationToken);

        await using (var drop = new NpgsqlCommand(
            $"DROP DATABASE IF EXISTS \"{database}\" WITH (FORCE)",
            connection))
        {
            await drop.ExecuteNonQueryAsync(cancellationToken);
        }

        await using var create = new NpgsqlCommand(
            $"CREATE DATABASE \"{database}\"",
            connection
        );

        await create.ExecuteNonQueryAsync(cancellationToken);
    }

    [GeneratedRegex("^[a-z0-9_]+_test$")]
    private static partial Regex TestDatabaseName();
}
