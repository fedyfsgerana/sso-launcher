using SsoLauncher.Infrastructure.Persistence.Maintenance;

namespace SsoLauncher.Api.Maintenance;

public sealed class AuditPartitionWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<AuditPartitionWorker> logger)
    : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(24);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);

        do
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();

                var service = scope.ServiceProvider
                    .GetRequiredService<AuditPartitionService>();

                var created = await service.EnsureAsync(stoppingToken);

                if (created > 0)
                {
                    logger.LogInformation(
                        "{Count} partisi bulanan riwayat aktivitas dibuat.",
                        created
                    );
                }
            }
            catch (OperationCanceledException)
            {
                return;
            }
            catch (Exception error)
            {
                logger.LogError(error, "Pembuatan partisi riwayat aktivitas gagal.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
