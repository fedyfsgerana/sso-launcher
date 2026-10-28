namespace SsoLauncher.Application.Applications.GetApplications;

public sealed record ApplicationSummaryResponse(
    int Total,
    int Active,
    int Maintenance,
    int Inactive
);
