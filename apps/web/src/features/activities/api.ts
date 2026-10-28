import { z } from "zod";
import { idSchema } from "@/lib/schemas/id";
import { apiClient } from "@/lib/api/client";
import type { PortalActivity } from "@/types/portal";

const activitySchema = z.object({
  id: idSchema,
  kind: z.literal("application"),
  applicationId: idSchema.nullable(),
  title: z.string(),
  subtitle: z.string(),
  targetPath: z.string().nullable(),
  occurredAt: z.iso.datetime({ offset: true }),
});

const activitiesSchema = z.array(activitySchema);

export type RecordActivityInput = {
  kind: "application";
  applicationId?: string | null;
  title: string;
  subtitle?: string;
  targetPath?: string | null;
};

export async function getActivities(take = 20): Promise<PortalActivity[]> {
  const response = await apiClient<unknown>(`/api/activities?take=${take}`);

  return activitiesSchema.parse(response);
}

const recentActionSchema = z.object({
  id: idSchema,
  action: z.string(),
  targetType: z.string(),
  targetName: z.string(),
  summary: z.string(),
  occurredAt: z.iso.datetime({ offset: true }),
});

const recentActionsSchema = z.array(recentActionSchema);

export type RecentAction = z.infer<typeof recentActionSchema>;

export async function getRecentActions(take = 10): Promise<RecentAction[]> {
  const response = await apiClient<unknown>(
    `/api/activities/recent-actions?take=${take}`,
  );

  return recentActionsSchema.parse(response);
}

export async function recordActivity(
  input: RecordActivityInput,
): Promise<void> {
  await apiClient<void>("/api/activities", {
    method: "POST",
    body: JSON.stringify({
      kind: input.kind,
      applicationId: input.applicationId ?? null,
      title: input.title,
      subtitle: input.subtitle ?? "",
      targetPath: input.targetPath ?? null,
    }),
  });
}

export async function deleteActivity(activityId: string): Promise<void> {
  await apiClient<void>(`/api/activities/${activityId}`, {
    method: "DELETE",
  });
}

export async function clearActivities(): Promise<void> {
  await apiClient<void>("/api/activities", {
    method: "DELETE",
  });
}
