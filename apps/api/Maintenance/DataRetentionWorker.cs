using Microsoft.Extensions.Options;
using SsoLauncher.Infrastructure.Persistence.Maintenance;

namespace SsoLauncher.Api.Maintenance;

public sealed class DataRetentionWorker(
    IServiceScopeFactory scopeFactory,
    IOptions<DataRetentionOptions> options,
    ILogger<DataRetentionWorker> logger)
    : BackgroundService
{
    private static readonly TimeSpan StartupDelay = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Value.Enabled)
        {
            return;
        }

        try
        {
            await Task.Delay(StartupDelay, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        var interval = TimeSpan.FromHours(
            Math.Clamp(options.Value.IntervalHours, 1, 24 * 30)
        );

        using var timer = new PeriodicTimer(interval);

        do
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();

                var service = scope.ServiceProvider
                    .GetRequiredService<DataRetentionService>();

                await service.RunAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                return;
            }
            catch (Exception error)
            {
                logger.LogError(error, "Pembersihan data lama gagal dijalankan.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
