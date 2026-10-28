using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;

namespace SsoLauncher.Application.Applications.GetApplicationUsers;

public sealed class GetApplicationUsersService(
    ISsoLauncherDbContext dbContext)
{
    public async Task<IReadOnlyList<ApplicationUserResponse>?> GetAsync(
        long applicationId,
        CancellationToken cancellationToken = default)
    {
        var exists = await dbContext.Applications
            .AnyAsync(
                x => x.Id == applicationId,
                cancellationToken
            );

        if (!exists)
        {
            return null;
        }

        var fromGroups = await dbContext.UserGroupApplicationAccesses
            .AsNoTracking()
            .Where(x =>
                x.ApplicationId == applicationId &&
                x.UserGroup.IsActive)
            .SelectMany(x => x.UserGroup.Members.Select(member => new
            {
                member.UserId,
                GroupName = x.UserGroup.Name
            }))
            .ToListAsync(cancellationToken);

        var userIds = fromGroups
            .Select(x => x.UserId)
            .Distinct()
            .ToList();

        if (userIds.Count == 0)
        {
            return [];
        }

        var users = await dbContext.Users
            .AsNoTracking()
            .Where(x => userIds.Contains(x.Id))
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Email,
                x.Department,
                x.DepartemenCode,
                x.JobTitle,
                x.IsActive
            })
            .ToListAsync(cancellationToken);

        return users
            .Select(user =>
            {
                var groups = fromGroups
                    .Where(x => x.UserId == user.Id)
                    .ToList();

                return new ApplicationUserResponse(
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Department,
                    user.DepartemenCode,
                    user.JobTitle,
                    user.IsActive,
                    groups
                        .Select(x => x.GroupName)
                        .Distinct()
                        .OrderBy(x => x)
                        .ToList()
                );
            })
            .ToList();
    }
}
