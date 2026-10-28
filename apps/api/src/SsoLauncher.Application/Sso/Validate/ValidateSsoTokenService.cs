using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Abstractions.Security;
using SsoLauncher.Application.Access;
using SsoLauncher.Application.ServiceCredentials;

namespace SsoLauncher.Application.Sso.Validate;

public sealed class ValidateSsoTokenService(
    ISsoLauncherDbContext dbContext,
    ISsoTokenService ssoTokenService,
    ISsoTokenReplayGuard replayGuard)
{
    public async Task<ValidateSsoTokenResponse?> ValidateAsync(
        string token,
        long applicationId,
        string clientId,
        string requiredScope,
        CancellationToken cancellationToken = default)
    {
        var validation =
            ssoTokenService.Validate(token);

        if (validation is null ||
            validation.ApplicationId != applicationId)
        {
            return null;
        }

        var credential =
            await dbContext.ApplicationServiceCredentials
                .AsNoTracking()
                .Where(x =>
                    x.ApplicationId == applicationId &&
                    x.ClientId == clientId &&
                    x.IsActive &&
                    x.Application.IsActive)
                .Select(x => new
                {
                    x.Scope,
                    x.Application.Slug
                })
                .SingleOrDefaultAsync(
                    cancellationToken
                );

        if (credential is null ||
            !ServiceScopes.Contains(
                credential.Scope,
                requiredScope))
        {
            return null;
        }

        var user =
            await dbContext.Users
                .AsNoTracking()
                .Where(x =>
                    x.Id == validation.UserId &&
                    x.IsActive)
                .Select(x => new
                {
                    x.Id,
                    x.Name,
                    x.Email,
                    x.EmployeeNumber,
                    x.Department,
                    x.DepartemenCode,
                    x.JobTitle
                })
                .SingleOrDefaultAsync(
                    cancellationToken
                );

        if (user is null)
        {
            return null;
        }

        var hasAccess = await EffectiveAccessQueries
            .ApplicationIdsForUser(dbContext, user.Id, applicationId)
            .AnyAsync(cancellationToken);

        if (!hasAccess)
        {
            return null;
        }

        if (!await replayGuard.TryConsumeAsync(
                validation.TokenId,
                validation.ExpiresAt,
                cancellationToken))
        {
            return null;
        }

        var groups =
            await dbContext.UserGroupMembers
                .AsNoTracking()
                .Where(x =>
                    x.UserId == user.Id &&
                    x.UserGroup.IsActive &&
                    x.UserGroup.Accesses.Any(access =>
                        access.ApplicationId == applicationId))
                .OrderBy(x => x.UserGroup.Name)
                .Select(x => x.UserGroup.Name)
                .ToListAsync(cancellationToken);

        return new ValidateSsoTokenResponse(
            user.Id,
            user.Name,
            user.Email,
            user.EmployeeNumber,
            user.Department,
            user.DepartemenCode,
            user.JobTitle,
            applicationId,
            credential.Slug,
            groups,
            validation.ExpiresAt
        );
    }
}
