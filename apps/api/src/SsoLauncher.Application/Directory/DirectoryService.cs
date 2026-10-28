using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.ServiceCredentials;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.Directory;

public sealed class DirectoryService(ISsoLauncherDbContext dbContext)
{
    private const int MaxPageSize = 200;

    public async Task<bool> IsAllowedAsync(
        long applicationId,
        string clientId,
        CancellationToken cancellationToken = default)
    {
        var scope = await dbContext.ApplicationServiceCredentials
            .AsNoTracking()
            .Where(x =>
                x.ApplicationId == applicationId &&
                x.ClientId == clientId &&
                x.IsActive &&
                x.Application.IsActive)
            .Select(x => x.Scope)
            .SingleOrDefaultAsync(cancellationToken);

        return scope is not null &&
               ServiceScopes.Contains(scope, ServiceScopes.UsersRead);
    }

    public async Task<DirectoryUserListResponse> ListAsync(
        long applicationId,
        string? search,
        DateTimeOffset? updatedSince,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = UsersWithAccess(applicationId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim().ToLower();

            query = query.Where(x =>
                x.Name.ToLower().Contains(keyword) ||
                x.Email.ToLower().Contains(keyword) ||
                (x.EmployeeNumber != null && x.EmployeeNumber.ToLower().Contains(keyword)) ||
                (x.Department != null && x.Department.ToLower().Contains(keyword)) ||
                (x.DepartemenCode != null && x.DepartemenCode.ToLower().Contains(keyword)));
        }

        if (updatedSince is not null)
        {
            query = query.Where(x => x.UpdatedAt >= updatedSince);
        }

        var total = await query.CountAsync(cancellationToken);

        var users = await query
            .OrderBy(x => x.Name)
            .ThenBy(x => x.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Email,
                x.EmployeeNumber,
                x.Department,
                x.DepartemenCode,
                x.JobTitle,
                x.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        var details = await AccessDetailsAsync(
            applicationId,
            users.Select(x => x.Id).ToList(),
            cancellationToken
        );

        var items = users
            .Select(user =>
            {
                var detail = details.GetValueOrDefault(user.Id);

                return new DirectoryUserResponse(
                    user.Id,
                    user.Name,
                    user.Email,
                    user.EmployeeNumber,
                    user.Department,
                    user.DepartemenCode,
                    user.JobTitle,
                    detail?.Groups ?? [],
                    user.UpdatedAt
                );
            })
            .ToList();

        return new DirectoryUserListResponse(total, page, pageSize, items);
    }

    public async Task<DirectoryUserStatusResponse?> GetAsync(
        long applicationId,
        long userId,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users
            .AsNoTracking()
            .Where(x => x.Id == userId)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Email,
                x.EmployeeNumber,
                x.Department,
                x.DepartemenCode,
                x.JobTitle,
                x.IsActive,
                x.UpdatedAt
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            return null;
        }

        var details = await AccessDetailsAsync(
            applicationId,
            [user.Id],
            cancellationToken
        );

        var detail = details.GetValueOrDefault(user.Id);
        var hasAccess = user.IsActive && detail is not null;

        return new DirectoryUserStatusResponse(
            user.Id,
            user.IsActive,
            hasAccess,
            hasAccess
                ? new DirectoryUserResponse(
                    user.Id,
                    user.Name,
                    user.Email,
                    user.EmployeeNumber,
                    user.Department,
                    user.DepartemenCode,
                    user.JobTitle,
                    detail!.Groups,
                    user.UpdatedAt
                )
                : null
        );
    }

    private IQueryable<User> UsersWithAccess(long applicationId)
    {
        return dbContext.Users
            .AsNoTracking()
            .Where(user =>
                user.IsActive &&
                dbContext.UserGroupMembers.Any(member =>
                    member.UserId == user.Id &&
                    member.UserGroup.IsActive &&
                    member.UserGroup.Accesses.Any(access =>
                        access.ApplicationId == applicationId)));
    }

    private async Task<Dictionary<long, AccessDetail>> AccessDetailsAsync(
        long applicationId,
        IReadOnlyCollection<long> userIds,
        CancellationToken cancellationToken)
    {
        if (userIds.Count == 0)
        {
            return new Dictionary<long, AccessDetail>();
        }

        var fromGroups = await dbContext.UserGroupMembers
            .AsNoTracking()
            .Where(x => userIds.Contains(x.UserId) && x.UserGroup.IsActive)
            .SelectMany(
                x => x.UserGroup.Accesses.Where(access => access.ApplicationId == applicationId),
                (member, access) => new
                {
                    member.UserId,
                    GroupName = member.UserGroup.Name
                })
            .ToListAsync(cancellationToken);

        var result = new Dictionary<long, AccessDetail>();

        foreach (var userId in fromGroups.Select(x => x.UserId).Distinct())
        {
            result[userId] = new AccessDetail(
                fromGroups
                    .Where(x => x.UserId == userId)
                    .Select(x => x.GroupName)
                    .Distinct()
                    .Order()
                    .ToList()
            );
        }

        return result;
    }

    private sealed record AccessDetail(IReadOnlyList<string> Groups);
}
