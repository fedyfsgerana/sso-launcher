using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Domain.Entities;

namespace SsoLauncher.Application.Account;

public sealed class NotificationSettingsService(ISsoLauncherDbContext dbContext)
{
    public async Task<NotificationSettingsResponse> GetAsync(
        long userId,
        CancellationToken cancellationToken = default)
    {
        var setting = await dbContext.NotificationSettings
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        return setting is null
            ? new NotificationSettingsResponse(true, true)
            : new NotificationSettingsResponse(
                setting.AccessChanges,
                setting.ApplicationStatus
            );
    }

    public async Task<NotificationSettingsResponse> UpdateAsync(
        long userId,
        NotificationSettingsResponse request,
        CancellationToken cancellationToken = default)
    {
        var setting = await dbContext.NotificationSettings
            .SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        if (setting is null)
        {
            setting = new NotificationSetting { UserId = userId };
            dbContext.NotificationSettings.Add(setting);
        }

        setting.AccessChanges = request.AccessChanges;
        setting.ApplicationStatus = request.ApplicationStatus;
        setting.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return new NotificationSettingsResponse(
            setting.AccessChanges,
            setting.ApplicationStatus
        );
    }
}

public sealed record NotificationSettingsResponse(
    bool AccessChanges,
    bool ApplicationStatus
);