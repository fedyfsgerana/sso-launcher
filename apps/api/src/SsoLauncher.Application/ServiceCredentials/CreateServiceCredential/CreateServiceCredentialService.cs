using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Domain.Constants;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.ServiceCredentials.CreateServiceCredential;

public sealed class CreateServiceCredentialService(
    ISsoLauncherDbContext dbContext,
    IPasswordHasher passwordHasher,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader,
    AuditScope auditScope)
{
    public async Task<CreateServiceCredentialResponse?> CreateAsync(
        CreateServiceCredentialRequest request,
        CancellationToken cancellationToken = default)
    {
        var scope =
            NormalizeScope(request.Scope);

        if (scope is null)
        {
            return null;
        }

        var application =
            await dbContext.Applications
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    x =>
                        x.Id == request.ApplicationId &&
                        x.IsActive,
                    cancellationToken
                );

        if (application is null)
        {
            return null;
        }

        var clientId =
            $"sso_{Convert.ToHexString(
                RandomNumberGenerator.GetBytes(16)
            ).ToLowerInvariant()}";

        var clientSecret =
            Convert.ToBase64String(
                RandomNumberGenerator.GetBytes(32)
            );

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var now =
            DateTimeOffset.UtcNow;

        var credential =
            new ApplicationServiceCredential
            {
                ApplicationId = request.ApplicationId,
                ClientId = clientId,
                SecretHash =
                    passwordHasher.Hash(clientSecret),
                Scope = scope,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

        dbContext.ApplicationServiceCredentials.Add(
            credential
        );

        await dbContext.SaveChangesAsync(
            cancellationToken
        );

        var after = await snapshotReader.ServiceCredentialAsync(
            credential.Id,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            auditScope.ActorId,
            auditScope.ActorName,
            AuditActions.Create,
            AuditTargets.ServiceCredential,
            credential.Id,
            $"{application.Name} - {clientId}",
            null,
            after,
            $"Scope {scope}",
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new CreateServiceCredentialResponse(
            credential.Id,
            credential.ApplicationId,
            credential.ClientId,
            clientSecret,
            credential.Scope,
            credential.CreatedAt
        );
    }

    private static string? NormalizeScope(
        string scope)
    {
        if (string.IsNullOrWhiteSpace(scope))
        {
            return null;
        }

        var scopes =
            scope.Split(
                    ' ',
                    StringSplitOptions.RemoveEmptyEntries |
                    StringSplitOptions.TrimEntries
                )
                .Distinct(StringComparer.Ordinal)
                .OrderBy(x => x, StringComparer.Ordinal)
                .ToArray();

        if (scopes.Length == 0 ||
            scopes.Any(
                x => !ServiceScopes.IsSupported(x)))
        {
            return null;
        }

        return string.Join(' ', scopes);
    }
}