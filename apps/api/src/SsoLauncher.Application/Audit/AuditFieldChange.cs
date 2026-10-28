using System.Text.Json.Nodes;

namespace SsoLauncher.Application.Audit;

public sealed record AuditFieldChange(
    string Field,
    JsonNode? Before,
    JsonNode? After
);