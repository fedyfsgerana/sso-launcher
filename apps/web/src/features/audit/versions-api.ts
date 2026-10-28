import { z } from "zod";
import { idSchema } from "@/lib/schemas/id";
import { apiClient } from "@/lib/api/client";

export const VERSIONED_TYPES = [
  "user",
  "application",
  "user_group",
  "portal_menu",
  "access",
  "service_credential",
] as const;

const ROLLBACK_TYPES = new Set<string>([
  "user",
  "application",
  "user_group",
  "portal_menu",
  "access",
]);

const versionSchema = z.object({
  version: z.number(),
  action: z.string(),
  actorName: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
  auditLogId: idSchema.nullable(),
  summary: z.string(),
  reason: z.string().nullable(),
  isCurrent: z.boolean(),
  snapshot: z.record(z.string(), z.unknown()).nullable(),
  changes: z.array(
    z.object({
      field: z.string(),
      before: z.unknown(),
      after: z.unknown(),
    }),
  ),
});

export type DataVersion = z.infer<typeof versionSchema>;

export function hasVersions(entityType: string): boolean {
  return (VERSIONED_TYPES as readonly string[]).includes(entityType);
}

export function canRollback(entityType: string): boolean {
  return ROLLBACK_TYPES.has(entityType);
}

export function isDeletedSnapshot(version: DataVersion): boolean {
  return version.snapshot?.deleted === true;
}

export async function getVersions(
  entityType: string,
  entityId: string,
): Promise<DataVersion[]> {
  const response = await apiClient<unknown>(
    `/api/admin/versions/${entityType}/${entityId}`,
  );

  return z.array(versionSchema).parse(response);
}

export async function rollbackVersion(
  entityType: string,
  entityId: string,
  version: number,
  reason: string,
): Promise<void> {
  await apiClient<void>(
    `/api/admin/versions/${entityType}/${entityId}/rollback`,
    {
      method: "POST",
      body: JSON.stringify({ version, reason }),
    },
  );
}
