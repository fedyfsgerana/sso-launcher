#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Common.Paging;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.Users.GetUsers;

public sealed class GetUsersService(
    ISsoLauncherDbContext dbContext)
{
    public Task<IReadOnlyList<UserResponse>> GetAsync(
        CancellationToken cancellationToken = default)
    {
        return ListAsync(null, cancellationToken);
    }

    public async Task<IReadOnlyList<UserResponse>?> GetForGroupAsync(
        long groupId,
        CancellationToken cancellationToken = default)
    {
        var group = await dbContext.UserGroups
            .AsNoTracking()
            .Where(x => x.Id == groupId)
            .Select(x => new { x.DepartemenCode })
            .SingleOrDefaultAsync(cancellationToken);

        return group is null
            ? null
            : await ListAsync(group.DepartemenCode, cancellationToken);
    }

    public async Task<UserSummaryResponse> GetSummaryAsync(
        CancellationToken cancellationToken = default)
    {
        var counts = await dbContext.Users
            .AsNoTracking()
            .GroupBy(x => x.IsActive)
            .Select(group => new { Active = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);

        var active = counts.FirstOrDefault(x => x.Active)?.Count ?? 0;
        var inactive = counts.FirstOrDefault(x => !x.Active)?.Count ?? 0;

        return new UserSummaryResponse(active + inactive, active, inactive);
    }

    public async Task<UserResponse?> GetByIdAsync(
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
                x.CreatedAt,
                x.UpdatedAt
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            return null;
        }

        var groups = await dbContext.UserGroupMembers
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.UserGroup.Name)
            .Select(x => new UserGroupRef(x.UserGroupId, x.UserGroup.Name))
            .ToListAsync(cancellationToken);

        return new UserResponse(
            user.Id,
            user.Name,
            user.Email,
            user.EmployeeNumber,
            user.Department,
            user.DepartemenCode,
            user.JobTitle,
            user.IsActive,
            user.CreatedAt,
            user.UpdatedAt,
            groups
        );
    }

    public async Task<PagedResponse<UserResponse>?> GetGroupOptionsPageAsync(
        long groupId,
        GroupUserOptionsRequest request,
        CancellationToken cancellationToken = default)
    {
        var group = await dbContext.UserGroups
            .AsNoTracking()
            .Where(x => x.Id == groupId)
            .Select(x => new { x.DepartemenCode })
            .SingleOrDefaultAsync(cancellationToken);

        if (group is null)
        {
            return null;
        }

        return await GetPageAsync(
            new UserPageRequest(
                request.Page,
                request.PageSize,
                request.Search,
                null,
                null,
                request.View == "members" ? groupId : null,
                request.Sort,
                request.Direction,
                request.View == "others" ? groupId : null,
                group.DepartemenCode
            ),
            cancellationToken
        );
    }

    public async Task<PagedResponse<UserResponse>> GetPageAsync(
        UserPageRequest request,
        CancellationToken cancellationToken = default)
    {
        var page = PageQuery.NormalizePage(request.Page);
        var pageSize = PageQuery.NormalizePageSize(request.PageSize);
        var search = PageQuery.NormalizeSearch(request.Search);

        var query = dbContext.Users.AsNoTracking();

        if (search is not null)
        {
            query = query.Where(x =>
                x.Name.ToLower().Contains(search) ||
                x.Email.ToLower().Contains(search) ||
                (x.EmployeeNumber != null && x.EmployeeNumber.ToLower().Contains(search)));
        }

        if (request.Status == "active")
        {
            query = query.Where(x => x.IsActive);
        }
        else if (request.Status == "inactive")
        {
            query = query.Where(x => !x.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(request.Department))
        {
            query = query.Where(x => x.Department == request.Department);
        }

        if (!string.IsNullOrWhiteSpace(request.DepartemenCode))
        {
            query = query.Where(x => x.DepartemenCode == request.DepartemenCode);
        }

        if (request.GroupId is { } groupId)
        {
            query = query.Where(x => dbContext.UserGroupMembers
                .Any(member => member.UserId == x.Id && member.UserGroupId == groupId));
        }

        if (request.ExcludeGroupId is { } excludeGroupId)
        {
            query = query.Where(x => !dbContext.UserGroupMembers
                .Any(member => member.UserId == x.Id && member.UserGroupId == excludeGroupId));
        }

        var total = await query.CountAsync(cancellationToken);
        var ordered = ApplySort(query, request.Sort, PageQuery.IsDescending(request.Direction));

        var users = await ordered
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
                x.IsActive,
                x.CreatedAt,
                x.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        var ids = users.Select(x => x.Id).ToList();
        var memberships = await dbContext.UserGroupMembers
            .AsNoTracking()
            .Where(x => ids.Contains(x.UserId))
            .OrderBy(x => x.UserGroup.Name)
            .Select(x => new
            {
                x.UserId,
                x.UserGroupId,
                x.UserGroup.Name
            })
            .ToListAsync(cancellationToken);

        var lookup = memberships
            .GroupBy(x => x.UserId)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyList<UserGroupRef>)group
                    .Select(x => new UserGroupRef(x.UserGroupId, x.Name))
                    .ToList()
            );

        var items = users
            .Select(x => new UserResponse(
                x.Id,
                x.Name,
                x.Email,
                x.EmployeeNumber,
                x.Department,
                x.DepartemenCode,
                x.JobTitle,
                x.IsActive,
                x.CreatedAt,
                x.UpdatedAt,
                lookup.TryGetValue(x.Id, out var groups) ? groups : []
            ))
            .ToList();

        return new PagedResponse<UserResponse>(items, total, page, pageSize);
    }

    private static IOrderedQueryable<User> ApplySort(
        IQueryable<User> query,
        string? sort,
        bool descending)
    {
        IOrderedQueryable<User> ordered = sort switch
        {
            "employeeNumber" => descending
                ? query.OrderByDescending(x => x.EmployeeNumber)
                : query.OrderBy(x => x.EmployeeNumber),
            "email" => descending
                ? query.OrderByDescending(x => x.Email)
                : query.OrderBy(x => x.Email),
            "department" => descending
                ? query.OrderByDescending(x => x.Department)
                : query.OrderBy(x => x.Department),
            "status" => descending
                ? query.OrderByDescending(x => x.IsActive)
                : query.OrderBy(x => x.IsActive),
            "updatedAt" => descending
                ? query.OrderByDescending(x => x.UpdatedAt)
                : query.OrderBy(x => x.UpdatedAt),
            "name" => descending
                ? query.OrderByDescending(x => x.Name)
                : query.OrderBy(x => x.Name),
            _ => query
                .OrderByDescending(x => x.CreatedAt)
                .ThenByDescending(x => x.Id)
        };

        return ordered.ThenBy(x => x.Id);
    }

    private async Task<IReadOnlyList<UserResponse>> ListAsync(
        string? departemenCode,
        CancellationToken cancellationToken)
    {
        var users = await dbContext.Users
            .AsNoTracking()
            .Where(x => departemenCode == null || x.DepartemenCode == departemenCode)
            .OrderBy(x => x.Name)
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
                x.CreatedAt,
                x.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        var memberships = await dbContext.UserGroupMembers
            .AsNoTracking()
            .OrderBy(x => x.UserGroup.Name)
            .Select(x => new
            {
                x.UserId,
                x.UserGroupId,
                x.UserGroup.Name
            })
            .ToListAsync(cancellationToken);

        var lookup = memberships
            .GroupBy(x => x.UserId)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyList<UserGroupRef>)group
                    .Select(x => new UserGroupRef(x.UserGroupId, x.Name))
                    .ToList()
            );

        return users
            .Select(x => new UserResponse(
                x.Id,
                x.Name,
                x.Email,
                x.EmployeeNumber,
                x.Department,
                x.DepartemenCode,
                x.JobTitle,
                x.IsActive,
                x.CreatedAt,
                x.UpdatedAt,
                lookup.TryGetValue(x.Id, out var groups) ? groups : []
            ))
            .ToList();
    }
}
