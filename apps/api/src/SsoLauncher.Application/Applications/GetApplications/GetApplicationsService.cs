#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Applications.Shared;
using SsoLauncher.Application.Common.Paging;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Applications.GetApplications;

public sealed class GetApplicationsService(
    ISsoLauncherDbContext dbContext)
{
    public async Task<List<ApplicationResponse>> GetAsync(
        CancellationToken cancellationToken = default)
    {
        var applications = await dbContext.Applications
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Slug,
                x.Description,
                x.AppUrl,
                x.LaunchUrl,
                x.Category,
                x.Icon,
                x.Color,
                x.Status,
                x.MaintenanceMessage,
                x.UsesSso,
                x.IsActive,
                CredentialCount = x.ServiceCredentials.Count(credential =>
                    credential.IsActive),
                x.CreatedAt,
                x.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        var fromGroups = await dbContext.UserGroupApplicationAccesses
            .AsNoTracking()
            .Where(x => x.UserGroup.IsActive)
            .SelectMany(x => x.UserGroup.Members
                .Where(member => member.User.IsActive)
                .Select(member => new
                {
                    x.ApplicationId,
                    member.UserId
                }))
            .ToListAsync(cancellationToken);

        var userCounts = fromGroups
            .Distinct()
            .GroupBy(x => x.ApplicationId)
            .ToDictionary(group => group.Key, group => group.Count());

        return applications
            .Select(x => new ApplicationResponse(
                x.Id,
                x.Name,
                x.Slug,
                x.Description,
                x.LaunchUrl,
                x.Category,
                x.Icon,
                x.Color,
                x.Status,
                x.MaintenanceMessage,
                x.UsesSso,
                x.IsActive,
                userCounts.GetValueOrDefault(x.Id),
                x.CredentialCount,
                x.CreatedAt,
                x.UpdatedAt,
                ApplicationUrls.AppUrlOf(x.AppUrl, x.LaunchUrl),
                ApplicationUrls.CallbackPathOf(
                    ApplicationUrls.AppUrlOf(x.AppUrl, x.LaunchUrl),
                    x.LaunchUrl,
                    x.UsesSso
                )
            ))
            .ToList();
    }

    public async Task<ApplicationSummaryResponse> GetSummaryAsync(
        CancellationToken cancellationToken = default)
    {
        var counts = await dbContext.Applications
            .AsNoTracking()
            .GroupBy(x => x.Status)
            .Select(group => new { Status = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);

        int CountOf(string status) =>
            counts.FirstOrDefault(x => x.Status == status)?.Count ?? 0;

        return new ApplicationSummaryResponse(
            counts.Sum(x => x.Count),
            CountOf(ApplicationStatuses.Active),
            CountOf(ApplicationStatuses.Maintenance),
            CountOf(ApplicationStatuses.Inactive)
        );
    }

    public async Task<PagedResponse<ApplicationResponse>> GetPageAsync(
        ApplicationPageRequest request,
        CancellationToken cancellationToken = default)
    {
        var page = PageQuery.NormalizePage(request.Page);
        var pageSize = PageQuery.NormalizePageSize(request.PageSize);
        var search = PageQuery.NormalizeSearch(request.Search);

        var query = dbContext.Applications.AsNoTracking();

        if (search is not null)
        {
            query = query.Where(x =>
                x.Name.ToLower().Contains(search) ||
                x.Slug.ToLower().Contains(search) ||
                x.Description.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            query = query.Where(x => x.Status == request.Status);
        }

        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            query = query.Where(x => x.Category == request.Category);
        }

        var total = await query.CountAsync(cancellationToken);
        var descending = PageQuery.IsDescending(request.Direction);

        var projected = query.Select(x => new
        {
            x.Id,
            x.Name,
            x.Slug,
            x.Description,
            x.AppUrl,
            x.LaunchUrl,
            x.Category,
            x.Icon,
            x.Color,
            x.Status,
            x.MaintenanceMessage,
            x.UsesSso,
            x.IsActive,
            CredentialCount = x.ServiceCredentials.Count(credential =>
                credential.IsActive),
            UserCount = dbContext.UserGroupMembers
                .Where(member =>
                    member.User.IsActive &&
                    member.UserGroup.IsActive &&
                    member.UserGroup.Accesses.Any(access =>
                        access.ApplicationId == x.Id))
                .Select(member => member.UserId)
                .Distinct()
                .Count(),
            x.CreatedAt,
            x.UpdatedAt
        });

        var ordered = request.Sort switch
        {
            "category" => descending
                ? projected.OrderByDescending(x => x.Category)
                : projected.OrderBy(x => x.Category),
            "users" => descending
                ? projected.OrderByDescending(x => x.UserCount)
                : projected.OrderBy(x => x.UserCount),
            "status" => descending
                ? projected.OrderByDescending(x => x.Status)
                : projected.OrderBy(x => x.Status),
            "updatedAt" => descending
                ? projected.OrderByDescending(x => x.UpdatedAt)
                : projected.OrderBy(x => x.UpdatedAt),
            "name" => descending
                ? projected.OrderByDescending(x => x.Name)
                : projected.OrderBy(x => x.Name),
            _ => projected
                .OrderByDescending(x => x.CreatedAt)
                .ThenByDescending(x => x.Id)
        };

        var rows = await ordered
            .ThenBy(x => x.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = rows
            .Select(x => new ApplicationResponse(
                x.Id,
                x.Name,
                x.Slug,
                x.Description,
                x.LaunchUrl,
                x.Category,
                x.Icon,
                x.Color,
                x.Status,
                x.MaintenanceMessage,
                x.UsesSso,
                x.IsActive,
                x.UserCount,
                x.CredentialCount,
                x.CreatedAt,
                x.UpdatedAt,
                ApplicationUrls.AppUrlOf(x.AppUrl, x.LaunchUrl),
                ApplicationUrls.CallbackPathOf(
                    ApplicationUrls.AppUrlOf(x.AppUrl, x.LaunchUrl),
                    x.LaunchUrl,
                    x.UsesSso
                )
            ))
            .ToList();

        return new PagedResponse<ApplicationResponse>(items, total, page, pageSize);
    }
}
