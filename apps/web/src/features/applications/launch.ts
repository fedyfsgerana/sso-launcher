import { ApiError, apiClient } from "@/lib/api/client";
import { recordActivity } from "@/features/activities/api";
import type { PortalApplication } from "@/types/portal";

export type LaunchResponse = {
  launchUrl: string;
  expiresAt: string | null;
  usesSso: boolean;
};

export function isSsoNotReady(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 409) {
    return false;
  }

  const body = error.body;

  return (
    typeof body === "object" &&
    body !== null &&
    "code" in body &&
    body.code === "sso_not_ready"
  );
}

export async function launchApplication(
  application: PortalApplication,
): Promise<LaunchResponse> {
  const response = await apiClient<LaunchResponse>("/api/sso/launch", {
    method: "POST",
    body: JSON.stringify({ applicationId: application.id }),
  });

  await recordActivity({
    kind: "application",
    applicationId: application.id,
    title: application.name,
    subtitle: application.description,
    targetPath: application.launchUrl,
  });

  return response;
}
