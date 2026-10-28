#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Common.Paging;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.UserGroups.GetUserGroups;

public sealed class GetUserGroupsService(
    ISsoLauncherDbContext dbContext)
{
    public async Task<IReadOnlyList<UserGroupResponse>> GetAsync(
        CancellationToken cancellationToken = default)
    {
        return await dbContext.UserGroups
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new UserGroupResponse(
                x.Id,
                x.Name,
                x.Description,
                x.Department,
                x.DepartemenCode,
                x.IsActive,
                x.Members.Count,
                x.Accesses.Count,
                x.MenuAccesses.Count,
                x.CreatedAt,
                x.UpdatedAt
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<UserGroupSummaryResponse> GetSummaryAsync(
        CancellationToken cancellationToken = default)
    {
        var groups = dbContext.UserGroups.AsNoTracking();

        var total = await groups.CountAsync(cancellationToken);
        var active = await groups.CountAsync(x => x.IsActive, cancellationToken);
        var withoutMembers = await groups.CountAsync(
            x => x.Members.Count == 0,
            cancellationToken
        );

        return new UserGroupSummaryResponse(
            total,
            active,
            total - active,
            withoutMembers
        );
    }

    public async Task<PagedResponse<UserGroupResponse>> GetPageAsync(
        UserGroupPageRequest request,
        CancellationToken cancellationToken = default)
    {
        var page = PageQuery.NormalizePage(request.Page);
        var pageSize = PageQuery.NormalizePageSize(request.PageSize);
        var search = PageQuery.NormalizeSearch(request.Search);

        var query = dbContext.UserGroups.AsNoTracking();

        if (search is not null)
        {
            query = query.Where(x =>
                x.Name.ToLower().Contains(search) ||
                x.Description.ToLower().Contains(search));
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

        var total = await query.CountAsync(cancellationToken);
        var descending = PageQuery.IsDescending(request.Direction);

        IOrderedQueryable<UserGroup> ordered = request.Sort switch
        {
            "department" => descending
                ? query.OrderByDescending(x => x.Department)
                : query.OrderBy(x => x.Department),
            "members" => descending
                ? query.OrderByDescending(x => x.Members.Count)
                : query.OrderBy(x => x.Members.Count),
            "applications" => descending
                ? query.OrderByDescending(x => x.Accesses.Count)
                : query.OrderBy(x => x.Accesses.Count),
            "menus" => descending
                ? query.OrderByDescending(x => x.MenuAccesses.Count)
                : query.OrderBy(x => x.MenuAccesses.Count),
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

        var items = await ordered
            .ThenBy(x => x.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new UserGroupResponse(
                x.Id,
                x.Name,
                x.Description,
                x.Department,
                x.DepartemenCode,
                x.IsActive,
                x.Members.Count,
                x.Accesses.Count,
                x.MenuAccesses.Count,
                x.CreatedAt,
                x.UpdatedAt
            ))
            .ToListAsync(cancellationToken);

        return new PagedResponse<UserGroupResponse>(items, total, page, pageSize);
    }
}
