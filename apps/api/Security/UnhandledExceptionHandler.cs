using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace SsoLauncher.Api.Security;

public sealed class UnhandledExceptionHandler(
    IProblemDetailsService problemDetails,
    ILogger<UnhandledExceptionHandler> logger) : IExceptionHandler
{
    public const string ReferenceHeader = "X-Reference-Id";

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is OperationCanceledException &&
            httpContext.RequestAborted.IsCancellationRequested)
        {
            return true;
        }

        var reference = ReferenceOf(httpContext);

        logger.LogError(
            exception,
            "Error tidak tertangani pada {Method} {Path} dengan nomor referensi {Reference}",
            httpContext.Request.Method,
            httpContext.Request.Path,
            reference
        );

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        httpContext.Response.Headers[ReferenceHeader] = reference;

        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Terjadi kesalahan pada server",
                Detail = $"Coba lagi beberapa saat. Kalau masih terjadi, hubungi Administrator Sistem dengan nomor referensi {reference}.",
                Extensions = { ["referenceId"] = reference }
            }
        });
    }

    private static string ReferenceOf(HttpContext httpContext)
    {
        var trace = System.Diagnostics.Activity.Current?.TraceId.ToString();
        var source = string.IsNullOrEmpty(trace)
            ? httpContext.TraceIdentifier
            : trace;
        var letters = new string(source.Where(char.IsLetterOrDigit).ToArray());

        return letters.Length >= 10
            ? letters[..10].ToUpperInvariant()
            : letters.ToUpperInvariant();
    }
}
