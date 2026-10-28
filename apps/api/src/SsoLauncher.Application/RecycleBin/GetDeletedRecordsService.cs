using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.RecycleBin;

public sealed class GetDeletedRecordsService(
    ISsoLauncherDbContext dbContext,
    GetDeletedUsersService deletedUsers,
    GetDeletedApplicationsService deletedApplications)
{
    public async Task<IReadOnlyList<DeletedItemResponse>?> GetAsync(
        string entityType,
        CancellationToken cancellationToken = default)
    {
        return entityType switch
        {
            AuditTargets.User =>
                await deletedUsers.GetAsync(cancellationToken),
            AuditTargets.Application =>
                await deletedApplications.GetAsync(cancellationToken),
            AuditTargets.UserGroup =>
                await GetGroupsAsync(cancellationToken),
            AuditTargets.PortalMenu =>
                await GetPortalMenusAsync(cancellationToken),
            _ => null
        };
    }

    private async Task<IReadOnlyList<DeletedItemResponse>> GetGroupsAsync(
        CancellationToken cancellationToken)
    {
        return await dbContext.UserGroups
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(x => x.DeletedAt != null)
            .OrderByDescending(x => x.DeletedAt)
            .Select(x => new DeletedItemResponse(
                x.Id,
                x.Name,
                x.Description,
                x.DeletedAt!.Value,
                x.DeletedByName,
                x.DeleteReason
            ))
            .ToListAsync(cancellationToken);
    }

    private async Task<IReadOnlyList<DeletedItemResponse>> GetPortalMenusAsync(
        CancellationToken cancellationToken)
    {
        return await dbContext.PortalMenus
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(x => x.DeletedAt != null)
            .OrderByDescending(x => x.DeletedAt)
            .Select(x => new DeletedItemResponse(
                x.Id,
                x.Label,
                x.TargetValue,
                x.DeletedAt!.Value,
                x.DeletedByName,
                x.DeleteReason,
                x.Icon
            ))
            .ToListAsync(cancellationToken);
    }
}
