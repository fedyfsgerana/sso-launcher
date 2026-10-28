import { z } from "zod";
import { apiClient } from "@/lib/api/client";

const insightsSchema = z.object({
  lastLogin: z
    .object({
      occurredAt: z.iso.datetime({ offset: true }),
      ipAddress: z.string().nullable(),
      browser: z.string().nullable(),
      browserVersion: z.string().nullable(),
      operatingSystem: z.string().nullable(),
      deviceType: z.string().nullable(),
      deviceName: z.string().nullable(),
    })
    .nullable(),
  lockedAccounts: z.number().nullable(),
  failedLoginsLastDay: z.number().nullable(),
  openedLastWeek: z.number().int().nonnegative().catch(0),
});

export type OverviewInsights = z.infer<typeof insightsSchema>;

export async function getOverviewInsights(): Promise<OverviewInsights> {
  const response = await apiClient<unknown>("/api/overview/insights");

  return insightsSchema.parse(response);
}
