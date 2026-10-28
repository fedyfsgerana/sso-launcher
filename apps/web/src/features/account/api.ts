import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { idSchema } from "@/lib/schemas/id";

const sessionSchema = z.object({
  id: idSchema,
  browser: z.string().nullable(),
  browserVersion: z.string().nullable(),
  operatingSystem: z.string().nullable(),
  deviceName: z.string().nullable(),
  ipAddress: z.string().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  lastSeenAt: z.iso.datetime({ offset: true }),
  expiresAt: z.iso.datetime({ offset: true }),
  isCurrent: z.boolean(),
});

const notificationSettingsSchema = z.object({
  accessChanges: z.boolean(),
  applicationStatus: z.boolean(),
});

const securityPolicySchema = z.object({
  idleMinutes: z.number(),
  sessionHours: z.number(),
  maxFailuresPerAddress: z.number(),
  maxFailuresPerAccount: z.number(),
  lockoutMinutes: z.number(),
  passwordMinimumLength: z.number(),
  passwordRequiresMixedCharacters: z.boolean().default(false),
});

export type AccountSession = z.infer<typeof sessionSchema>;
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
export type SecurityPolicy = z.infer<typeof securityPolicySchema>;

export async function getSessions(): Promise<AccountSession[]> {
  const response = await apiClient<unknown>("/api/account/sessions");

  return z.array(sessionSchema).parse(response);
}

export async function revokeSession(sessionId: string): Promise<void> {
  await apiClient<void>(`/api/account/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

export async function revokeOtherSessions(): Promise<number> {
  const response = await apiClient<unknown>(
    "/api/account/sessions/revoke-others",
    {
      method: "POST",
    },
  );

  return z.object({ revoked: z.number() }).parse(response).revoked;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const response = await apiClient<unknown>(
    "/api/account/notification-settings",
  );

  return notificationSettingsSchema.parse(response);
}

export async function updateNotificationSettings(
  settings: NotificationSettings,
): Promise<NotificationSettings> {
  const response = await apiClient<unknown>(
    "/api/account/notification-settings",
    {
      method: "PUT",
      body: JSON.stringify(settings),
    },
  );

  return notificationSettingsSchema.parse(response);
}

export async function getSecurityPolicy(): Promise<SecurityPolicy> {
  const response = await apiClient<unknown>("/api/account/security-policy");

  return securityPolicySchema.parse(response);
}
