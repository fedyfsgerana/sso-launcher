using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Abstractions.Security;

namespace SsoLauncher.Application.ServiceCredentials.IssueServiceAccessToken;

public sealed class IssueServiceAccessTokenService(
    ISsoLauncherDbContext dbContext,
    IPasswordHasher passwordHasher,
    IServiceAccessTokenService serviceAccessTokenService,
    IServiceAccessTokenLifetimeProvider lifetimeProvider)
{
    public async Task<IssueServiceAccessTokenResponse?> IssueAsync(
        IssueServiceAccessTokenRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.ClientId) ||
            string.IsNullOrWhiteSpace(request.ClientSecret))
        {
            return null;
        }

        var credential =
            await dbContext.ApplicationServiceCredentials
                .AsNoTracking()
                .Where(x =>
                    x.ClientId == request.ClientId &&
                    x.IsActive &&
                    x.Application.IsActive)
                .Select(x => new
                {
                    x.Id,
                    x.ApplicationId,
                    x.ClientId,
                    x.SecretHash,
                    x.Scope
                })
                .SingleOrDefaultAsync(
                    cancellationToken
                );

        if (credential is null)
        {
            return null;
        }

        if (!passwordHasher.Verify(
                request.ClientSecret,
                credential.SecretHash))
        {
            return null;
        }

        await dbContext.ApplicationServiceCredentials
            .Where(x => x.Id == credential.Id)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(
                    x => x.LastUsedAt,
                    DateTimeOffset.UtcNow
                ),
                cancellationToken
            );

        var lifetime =
            lifetimeProvider.Lifetime;

        var expiresAt =
            DateTimeOffset.UtcNow.Add(lifetime);

        var accessToken =
            serviceAccessTokenService.Generate(
                credential.ApplicationId,
                credential.ClientId,
                credential.Scope,
                expiresAt
            );

        return new IssueServiceAccessTokenResponse(
            accessToken,
            "Bearer",
            checked((int)lifetime.TotalSeconds),
            credential.Scope
        );
    }
}