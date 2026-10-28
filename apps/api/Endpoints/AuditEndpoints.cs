#nullable enable

using ClosedXML.Excel;
using SsoLauncher.Api.Authorization;
using SsoLauncher.Application.Audit.GetAuditLogs;
using SsoLauncher.Application.Auth.Session;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Api.Endpoints;

public static class AuditEndpoints
{
    public static IEndpointRouteBuilder MapAuditEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints
            .MapGroup("/api/admin/audit-logs")
            .WithTags("Audit");

        group.MapGet("/", GetLogsAsync)
            .WithName("GetAuditLogs")
            .WithSummary("Get audit records page by page")
            .WithDescription(
                "Returns audit records newest first, filtered by module, action, outcome, target, actor, IP address, date range, or a search term, one page at a time."
            )
            .Produces<AuditLogPageResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapGet("/{id:long}", GetDetailAsync)
            .WithName("GetAuditLogDetail")
            .WithSummary("Get one audit record in full")
            .WithDescription(
                "Returns one audit record with device, browser, session, request, reason, and field-level changes."
            )
            .Produces<AuditLogDetailResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapGet("/summary", GetSummaryAsync)
            .WithName("GetAuditSummary")
            .WithSummary("Get audit counters")
            .WithDescription(
                "Returns the number of records today, in the last seven days, and deletions in the last seven days, using the caller's UTC offset."
            )
            .Produces<AuditSummaryResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapGet("/actors", GetActorsAsync)
            .WithName("GetAuditActors")
            .WithSummary("Get everyone who appears as an actor")
            .WithDescription(
                "Returns the distinct actors found in the audit log, for the actor filter."
            )
            .Produces<IReadOnlyList<AuditActorResponse>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        group.MapGet("/export", ExportAsync)
            .WithName("ExportAuditLogs")
            .WithSummary("Export audit records as an Excel workbook")
            .WithDescription(
                "Returns up to 10,000 matching records as an .xlsx file, newest first."
            )
            .Produces(
                StatusCodes.Status200OK,
                contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status429TooManyRequests)
            .RequireRateLimiting("Export")
            .WithRequestTimeout("Export");

        return endpoints;
    }

    private static async Task<IResult> GetLogsAsync(
        HttpContext httpContext,
        SessionService sessionService,
        GetAuditLogsService service,
        CancellationToken cancellationToken,
        int page = 1,
        int pageSize = 10,
        string? action = null,
        string? targetType = null,
        string? search = null,
        long? targetId = null,
        long? actorId = null,
        DateTimeOffset? from = null,
        DateTimeOffset? to = null,
        string? module = null,
        string? outcome = null,
        string? ip = null,
        string? sort = null,
        string? direction = null)
    {
        var guard = await GuardAsync(
            httpContext,
            sessionService,
            targetId is not null,
            cancellationToken
        );

        if (guard is not null)
        {
            return guard;
        }

        var logs = await service.GetAsync(
            page,
            pageSize,
            new AuditLogFilter(action, targetType, search, targetId, actorId, from, to, module, outcome, ip, sort, direction),
            cancellationToken
        );

        return Results.Ok(logs);
    }

    private static async Task<IResult> GetDetailAsync(
        long id,
        HttpContext httpContext,
        SessionService sessionService,
        GetAuditLogsService service,
        CancellationToken cancellationToken)
    {
        var guard = await GuardAsync(
            httpContext,
            sessionService,
            false,
            cancellationToken
        );

        if (guard is not null)
        {
            return guard;
        }

        var detail = await service.GetDetailAsync(id, cancellationToken);

        return detail is null
            ? Results.NotFound()
            : Results.Ok(detail);
    }

    private static async Task<IResult> GetSummaryAsync(
        HttpContext httpContext,
        SessionService sessionService,
        GetAuditLogsService service,
        CancellationToken cancellationToken,
        int utcOffsetMinutes = 0)
    {
        var guard = await GuardAsync(
            httpContext,
            sessionService,
            false,
            cancellationToken
        );

        if (guard is not null)
        {
            return guard;
        }

        return Results.Ok(
            await service.GetSummaryAsync(utcOffsetMinutes, cancellationToken)
        );
    }

    private static async Task<IResult> GetActorsAsync(
        HttpContext httpContext,
        SessionService sessionService,
        GetAuditLogsService service,
        CancellationToken cancellationToken)
    {
        var guard = await GuardAsync(
            httpContext,
            sessionService,
            false,
            cancellationToken
        );

        if (guard is not null)
        {
            return guard;
        }

        return Results.Ok(await service.GetActorsAsync(cancellationToken));
    }

    private static async Task<IResult> ExportAsync(
        HttpContext httpContext,
        SessionService sessionService,
        GetAuditLogsService service,
        CancellationToken cancellationToken,
        string? action = null,
        string? targetType = null,
        string? search = null,
        long? targetId = null,
        long? actorId = null,
        DateTimeOffset? from = null,
        DateTimeOffset? to = null,
        string? module = null,
        string? outcome = null,
        string? ip = null,
        string? sort = null,
        string? direction = null)
    {
        var guard = await GuardAsync(
            httpContext,
            sessionService,
            false,
            cancellationToken,
            MenuActions.Export
        );

        if (guard is not null)
        {
            return guard;
        }

        var logs = await service.ExportAsync(
            new AuditLogFilter(action, targetType, search, targetId, actorId, from, to, module, outcome, ip, sort, direction),
            cancellationToken
        );

        var jakarta = TimeSpan.FromHours(7);

        using var workbook = new XLWorkbook();
        var sheet = workbook.AddWorksheet("Riwayat Aktivitas");

        var headers = new[]
        {
            "No",
            "Waktu (WIB)",
            "Dilakukan Oleh",
            "Aksi",
            "Hasil",
            "Modul",
            "Jenis Data",
            "Data Terkait",
            "Keterangan",
            "Alasan",
            "Alamat IP",
            "Perangkat",
            "Jenis Perangkat",
            "Sistem Operasi",
            "Browser",
            "Versi Browser"
        };

        for (var column = 0; column < headers.Length; column++)
        {
            sheet.Cell(1, column + 1).Value = headers[column];
        }

        var row = 2;

        foreach (var log in logs)
        {
            sheet.Cell(row, 1).Value = row - 1;
            sheet.Cell(row, 2).Value = log.OccurredAt.ToOffset(jakarta).DateTime;
            sheet.Cell(row, 2).Style.DateFormat.Format = "dd/mm/yyyy hh:mm:ss";
            sheet.Cell(row, 3).Value = log.ActorName;
            sheet.Cell(row, 4).Value = log.Action;
            sheet.Cell(row, 5).Value = log.Outcome;
            sheet.Cell(row, 6).Value = log.Module;
            sheet.Cell(row, 7).Value = log.TargetType;
            sheet.Cell(row, 8).Value = log.TargetName;
            sheet.Cell(row, 9).Value = log.Summary;
            sheet.Cell(row, 10).Value = log.Reason;
            sheet.Cell(row, 11).Value = log.IpAddress;
            sheet.Cell(row, 12).Value = log.DeviceName;
            sheet.Cell(row, 13).Value = log.DeviceType;
            sheet.Cell(row, 14).Value = log.OperatingSystem;
            sheet.Cell(row, 15).Value = log.Browser;
            sheet.Cell(row, 16).Value = log.BrowserVersion;

            row += 1;
        }

        var headerRow = sheet.Row(1);
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Font.FontColor = XLColor.White;
        headerRow.Style.Fill.BackgroundColor = XLColor.FromHtml("#1F5C43");
        headerRow.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        headerRow.Height = 22;

        var used = sheet.Range(1, 1, Math.Max(row - 1, 1), headers.Length);
        used.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        used.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        used.Style.Border.OutsideBorderColor = XLColor.FromHtml("#D6E0D8");
        used.Style.Border.InsideBorderColor = XLColor.FromHtml("#D6E0D8");
        used.SetAutoFilter();

        sheet.SheetView.FreezeRows(1);
        sheet.Columns().AdjustToContents(1, 200, 10, 46);
        sheet.Column(9).Style.Alignment.WrapText = false;

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        var fileName = $"riwayat-aktivitas-{DateTime.UtcNow.Add(jakarta):yyyyMMdd-HHmm}.xlsx";

        return Results.File(
            stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName
        );
    }


    private static async Task<IResult?> GuardAsync(
        HttpContext httpContext,
        SessionService sessionService,
        bool allowUsersMenu,
        CancellationToken cancellationToken,
        string? actionKey = null)
    {
        var authorization = actionKey is null
            ? await PortalAuthorization.AuthorizeMenuAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Audit,
                cancellationToken
            )
            : await PortalAuthorization.AuthorizeActionAsync(
                httpContext,
                sessionService,
                PortalMenuTargets.Audit,
                actionKey,
                cancellationToken
            );

        if (!authorization.IsAuthenticated)
        {
            return Results.Unauthorized();
        }

        if (authorization.IsAuthorized)
        {
            return null;
        }

        if (allowUsersMenu)
        {
            var users =
                await PortalAuthorization.AuthorizeMenuAsync(
                    httpContext,
                    sessionService,
                    PortalMenuTargets.Users,
                    cancellationToken
                );

            if (users.IsAuthorized)
            {
                return null;
            }
        }

        return Results.StatusCode(StatusCodes.Status403Forbidden);
    }
}
