using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace SsoLauncher.Application.Audit;

public static class AuditSnapshot
{
    private static readonly JsonSerializerOptions SerializerOptions =
        new(JsonSerializerDefaults.Web)
        {
            ReferenceHandler = ReferenceHandler.IgnoreCycles
        };

    private static readonly HashSet<string> HiddenFields =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "password",
            "passwordHash",
            "secret",
            "secretHash",
            "token",
            "tokenHash"
        };

    public static JsonObject? Capture(object? value)
    {
        if (value is null)
        {
            return null;
        }

        if (JsonSerializer.SerializeToNode(
                value,
                value.GetType(),
                SerializerOptions
            ) is not JsonObject node)
        {
            return null;
        }

        foreach (var key in node.Select(x => x.Key).ToList())
        {
            if (HiddenFields.Contains(key))
            {
                node.Remove(key);
            }
        }

        return node;
    }

    public static IReadOnlyList<AuditFieldChange> Diff(
        JsonObject? before,
        JsonObject? after)
    {
        var keys = new List<string>();

        foreach (var source in new[] { before, after })
        {
            if (source is null)
            {
                continue;
            }

            foreach (var pair in source)
            {
                if (!keys.Contains(pair.Key))
                {
                    keys.Add(pair.Key);
                }
            }
        }

        var changes = new List<AuditFieldChange>();

        foreach (var key in keys)
        {
            var oldValue = before?[key];
            var newValue = after?[key];

            if (JsonNode.DeepEquals(oldValue, newValue))
            {
                continue;
            }

            changes.Add(new AuditFieldChange(
                key,
                oldValue?.DeepClone(),
                newValue?.DeepClone()
            ));
        }

        return changes;
    }

    public static string Serialize(JsonNode node)
    {
        return node.ToJsonString(SerializerOptions);
    }

    public static string SerializeChanges(
        IReadOnlyList<AuditFieldChange> changes)
    {
        return JsonSerializer.Serialize(changes, SerializerOptions);
    }

    public static T? Deserialize<T>(string? json)
        where T : class
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        return JsonSerializer.Deserialize<T>(json, SerializerOptions);
    }

    public static IReadOnlyList<AuditFieldChange> ParseChanges(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        return JsonSerializer.Deserialize<List<AuditFieldChange>>(
            json,
            SerializerOptions
        ) ?? [];
    }

    public static JsonObject? Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        return JsonNode.Parse(json) as JsonObject;
    }
}