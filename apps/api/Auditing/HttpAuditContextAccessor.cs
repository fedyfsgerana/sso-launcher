using SsoLauncher.Api.Authorization;
using SsoLauncher.Application.Abstractions.Auditing;
using SsoLauncher.Application.Abstractions.Security;

namespace SsoLauncher.Api.Auditing;

public sealed class HttpAuditContextAccessor(
    IHttpContextAccessor httpContextAccessor,
    ISessionTokenService sessionTokenService)
    : IAuditContextAccessor
{
    public const string ItemKey = "SsoLauncher.AuditContext";

    public AuditContext Current
    {
        get
        {
            var httpContext = httpContextAccessor.HttpContext;

            if (httpContext is null)
            {
                return AuditContext.Empty;
            }

            if (httpContext.Items.TryGetValue(ItemKey, out var stored) &&
                stored is AuditContext context)
            {
                return context;
            }

            var created = Create(httpContext, sessionTokenService, null);

            httpContext.Items[ItemKey] = created;

            return created;
        }
    }

    public static AuditContext Create(
        HttpContext httpContext,
        ISessionTokenService sessionTokenService,
        string? deviceName)
    {
        var request = httpContext.Request;
        var userAgent = request.Headers.UserAgent.ToString();
        var info = UserAgentParser.Parse(userAgent, request.Headers);
        var address = httpContext.Connection.RemoteIpAddress;

        if (address is { IsIPv4MappedToIPv6: true })
        {
            address = address.MapToIPv4();
        }

        return new AuditContext(
            address?.ToString(),
            Limit(userAgent, 512),
            Limit(info.Browser, 60),
            Limit(info.BrowserVersion, 40),
            Limit(info.OperatingSystem, 60),
            info.DeviceType,
            Limit(deviceName, 255),
            ResolveSessionRef(httpContext, sessionTokenService),
            Limit(httpContext.TraceIdentifier, 100),
            request.Method,
            Limit(request.Path.Value, 300)
        );
    }

    private static string? ResolveSessionRef(
        HttpContext httpContext,
        ISessionTokenService sessionTokenService)
    {
        if (!httpContext.Request.Cookies.TryGetValue(
                PortalAuthorization.SessionCookieName,
                out var token) ||
            string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        return sessionTokenService.Hash(token)[..16];
    }

    private static string? Limit(string? value, int length)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Length <= length
            ? value
            : value[..length];
    }
}