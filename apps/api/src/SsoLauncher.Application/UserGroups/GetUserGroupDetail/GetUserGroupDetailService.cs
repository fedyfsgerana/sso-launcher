#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;

namespace SsoLauncher.Application.UserGroups.GetUserGroupDetail;

public sealed class GetUserGroupDetailService(
    ISsoLauncherDbContext dbContext)
{
    public async Task<UserGroupDetailResponse?> GetAsync(
        long groupId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.UserGroups
            .AsNoTracking()
            .Where(x => x.Id == groupId)
            .Select(x => new UserGroupDetailResponse(
                x.Id,
                x.Name,
                x.Description,
                x.Department,
                x.DepartemenCode,
                x.IsActive,
                x.Members
                    .OrderBy(member => member.User.Name)
                    .Select(member => new UserGroupMemberResponse(
                        member.UserId,
                        member.User.Name,
                        member.User.Email,
                        member.User.Department,
                        member.User.DepartemenCode,
                        member.User.JobTitle,
                        member.User.IsActive
                    ))
                    .ToList(),
                x.Accesses
                    .OrderBy(access => access.Application.Name)
                    .Select(access => new UserGroupAccessResponse(
                        access.ApplicationId,
                        access.Application.Name,
                        access.Application.Category,
                        access.Application.Icon,
                        access.Application.Color,
                        access.Application.Status
                    ))
                    .ToList(),
                x.MenuAccesses
                    .OrderBy(access => access.PortalMenu.SortOrder)
                    .Select(access => new UserGroupMenuResponse(
                        access.PortalMenuId,
                        access.PortalMenu.ParentId,
                        access.PortalMenu.Label,
                        access.PortalMenu.Icon,
                        access.PortalMenu.IsActive
                    ))
                    .ToList(),
                dbContext.UserGroupMenuActions
                    .Where(action => action.UserGroupId == x.Id)
                    .Select(action => new UserGroupMenuActionResponse(
                        action.PortalMenuId,
                        action.ActionKey
                    ))
                    .ToList()
            ))
            .SingleOrDefaultAsync(cancellationToken);
    }
}
