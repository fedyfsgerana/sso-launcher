using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;

namespace SsoLauncher.Application.ServiceCredentials.GetServiceCredentials;

public sealed class GetServiceCredentialsService(
    ISsoLauncherDbContext dbContext)
{
    public async Task<IReadOnlyList<ServiceCredentialResponse>> GetAsync(
        long? applicationId = null,
        CancellationToken cancellationToken = default)
    {
        var query =
            dbContext.ApplicationServiceCredentials
                .AsNoTracking()
                .AsQueryable();

        if (applicationId.HasValue)
        {
            query = query.Where(
                x => x.ApplicationId == applicationId.Value
            );
        }

        return await query
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .Select(x =>
                new ServiceCredentialResponse(
                    x.Id,
                    x.ApplicationId,
                    x.Application.Name,
                    x.ClientId,
                    x.Scope,
                    x.IsActive,
                    x.CreatedAt,
                    x.UpdatedAt,
                    x.LastUsedAt,
                    x.GuideDownloadedAt
                )
            )
            .ToListAsync(cancellationToken);
    }
}
