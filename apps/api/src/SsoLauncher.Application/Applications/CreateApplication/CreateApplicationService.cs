#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Applications.Shared;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Application.Common.Text;
using SsoLauncher.Application.Organization;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Applications.CreateApplication;

public sealed class CreateApplicationService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader,
    DepartmentCatalog departmentCatalog)
{
    public async Task<long?> CreateAsync(
        CreateApplicationRequest request,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        var name = TextFormat.Title(request.Name);
        var slug = ApplicationSlug.Normalize(request.Slug);
        var description = TextFormat.Sentence(request.Description);
        var urls = ApplicationUrls.Resolve(
            request.AppUrl,
            request.LaunchUrl,
            request.CallbackPath,
            request.UsesSso ?? true
        );
        var category = request.Category?.Trim() ?? string.Empty;
        var icon = request.Icon?.Trim() ?? string.Empty;
        var color = Fallback(request.Color, "app-hr");
        var status = Fallback(request.Status, ApplicationStatuses.Active);

        if (string.IsNullOrWhiteSpace(name) ||
            !ApplicationSlug.IsValid(slug) ||
            !ApplicationStatuses.IsValid(status) ||
            urls is null ||
            !await departmentCatalog.IsApplicationCategoryAsync(category, cancellationToken))
        {
            return null;
        }

        var slugExists = await dbContext.Applications
            .AnyAsync(
                x => x.Slug == slug,
                cancellationToken
            );

        if (slugExists)
        {
            return null;
        }

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var application = new Domain.Entities.Application
        {
            Name = name,
            Slug = slug,
            Description = description,
            AppUrl = urls.AppUrl,
            LaunchUrl = urls.LaunchUrl,
            Category = category,
            Icon = icon,
            Color = color,
            Status = status,
            UsesSso = request.UsesSso ?? true,
            IsActive = status != ApplicationStatuses.Inactive,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.Applications.Add(application);

        await dbContext.SaveChangesAsync(cancellationToken);

        var applicationId = application.Id;

        var after = await snapshotReader.ApplicationAsync(
            applicationId,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            actorId,
            actorName,
            AuditActions.Create,
            AuditTargets.Application,
            applicationId,
            name,
            null,
            after,
            $"Aplikasi baru dengan slug {slug}, status {ApplicationStatuses.Label(status)}, {(application.UsesSso ? "login lewat SSO" : "tanpa SSO")}",
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return applicationId;
    }

    private static string Fallback(string? value, string fallback)
    {
        var trimmed = value?.Trim();

        return string.IsNullOrWhiteSpace(trimmed) ? fallback : trimmed;
    }
}
