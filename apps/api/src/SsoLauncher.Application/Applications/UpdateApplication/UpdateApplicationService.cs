#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Applications.Shared;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Application.Common.Text;
using SsoLauncher.Application.Organization;
using SsoLauncher.Application.Notifications;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Applications.UpdateApplication;

public sealed class UpdateApplicationService(
    ISsoLauncherDbContext dbContext,
    Notifier notifier,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader,
    DepartmentCatalog departmentCatalog)
{
    public async Task<bool> UpdateAsync(
        long applicationId,
        UpdateApplicationRequest request,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        var name = TextFormat.Title(request.Name);
        var slug = ApplicationSlug.Normalize(request.Slug);
        var description = TextFormat.Sentence(request.Description);
        var category = request.Category?.Trim() ?? string.Empty;
        var icon = request.Icon?.Trim() ?? string.Empty;
        var color = Fallback(request.Color, "app-hr");
        var status = Fallback(request.Status, ApplicationStatuses.Active);

        if (string.IsNullOrWhiteSpace(name) ||
            !ApplicationSlug.IsValid(slug) ||
            !ApplicationStatuses.IsValid(status))
        {
            return false;
        }

        var application = await dbContext.Applications
            .SingleOrDefaultAsync(
                x => x.Id == applicationId,
                cancellationToken
            );

        if (application is null)
        {
            return false;
        }

        var usesSso = request.UsesSso ?? application.UsesSso;
        var urls = ApplicationUrls.Resolve(
            request.AppUrl,
            request.LaunchUrl,
            request.CallbackPath,
            usesSso
        );

        if (urls is null)
        {
            return false;
        }

        if (category != application.Category &&
            !await departmentCatalog.IsApplicationCategoryAsync(category, cancellationToken))
        {
            return false;
        }

        var slugExists = await dbContext.Applications
            .AnyAsync(
                x => x.Id != applicationId &&
                     x.Slug == slug,
                cancellationToken
            );

        if (slugExists)
        {
            return false;
        }

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var before = await snapshotReader.ApplicationAsync(
            applicationId,
            cancellationToken
        );

        var previousStatus = application.Status;

        application.Name = name;
        application.Slug = slug;
        application.Description = description;
        application.AppUrl = urls.AppUrl;
        application.LaunchUrl = urls.LaunchUrl;
        application.Category = category;
        application.Icon = icon;
        application.Color = color;
        application.Status = status;
        application.UsesSso = usesSso;
        application.MaintenanceMessage =
            status == ApplicationStatuses.Maintenance
                ? TextFormat.Sentence(request.MaintenanceMessage)
                : string.Empty;
        application.IsActive = status != ApplicationStatuses.Inactive;
        application.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        await notifier.NotifyApplicationStatusAsync(
            application.Id,
            application.Name,
            previousStatus,
            application.Status,
            application.MaintenanceMessage,
            cancellationToken
        );

        var after = await snapshotReader.ApplicationAsync(
            applicationId,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            actorId,
            actorName,
            AuditActions.Update,
            AuditTargets.Application,
            applicationId,
            name,
            before,
            after,
            $"Data aplikasi diperbarui, status sekarang {ApplicationStatuses.Label(status)}",
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return true;
    }

    private static string Fallback(string? value, string fallback)
    {
        var trimmed = value?.Trim();

        return string.IsNullOrWhiteSpace(trimmed) ? fallback : trimmed;
    }
}
