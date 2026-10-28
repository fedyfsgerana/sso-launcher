import { z } from "zod";
import { apiClient } from "@/lib/api/client";

export async function resetUserPassword(
  userId: string,
  newPassword: string,
): Promise<void> {
  await apiClient<void>(`/api/admin/users/${userId}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });
}

export async function revokeUserSessions(userId: string): Promise<number> {
  const response = await apiClient<unknown>(
    `/api/admin/users/${userId}/revoke-sessions`,
    { method: "POST" },
  );

  return z.object({ revoked: z.number() }).parse(response).revoked;
}

const loginLockSchema = z.object({
  recentFailures: z.number(),
  accountLockedUntil: z.iso.datetime({ offset: true }).nullable(),
  lockedAddresses: z.array(
    z.object({
      ipAddress: z.string(),
      failures: z.number(),
      lockedUntil: z.iso.datetime({ offset: true }),
    }),
  ),
  isLocked: z.boolean(),
});

export type LoginLock = z.infer<typeof loginLockSchema>;

export async function getUserLoginLock(userId: string): Promise<LoginLock> {
  const response = await apiClient<unknown>(
    `/api/admin/users/${userId}/login-lock`,
  );

  return loginLockSchema.parse(response);
}

export async function unlockUserLogin(userId: string): Promise<number> {
  const response = await apiClient<unknown>(
    `/api/admin/users/${userId}/unlock-login`,
    { method: "POST" },
  );

  return z.object({ cleared: z.number() }).parse(response).cleared;
}
