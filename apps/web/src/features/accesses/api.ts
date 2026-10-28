import { apiClient, withReason } from "@/lib/api/client";
import {
  accessSchema,
  applicationAccessesSchema,
  upsertAccessResultSchema,
  type AccessInput,
} from "@/lib/schemas/access";
import type {
  ApplicationAccess,
  UpsertAccessResult,
} from "@/features/accesses/types";

export async function getAccesses(): Promise<ApplicationAccess[]> {
  const response = await apiClient<unknown>("/api/admin/accesses");

  return applicationAccessesSchema.parse(response);
}

export async function upsertAccess(
  input: AccessInput,
): Promise<UpsertAccessResult> {
  const data = accessSchema.parse(input);

  const response = await apiClient<unknown>("/api/admin/accesses", {
    method: "PUT",
    body: JSON.stringify(data),
  });

  return upsertAccessResultSchema.parse(response);
}

export function revokeAccess(accessId: string, reason: string): Promise<void> {
  return apiClient<void>(
    withReason(`/api/admin/accesses/${accessId}`, reason),
    {
      method: "DELETE",
    },
  );
}
