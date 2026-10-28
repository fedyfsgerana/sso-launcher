import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { idSchema } from "@/lib/schemas/id";

const notificationSchema = z.object({
  id: idSchema,
  kind: z.string(),
  title: z.string(),
  body: z.string(),
  link: z.string().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  isRead: z.boolean(),
});

const notificationListSchema = z.object({
  unread: z.number(),
  items: z.array(notificationSchema),
});

export type PortalNotification = z.infer<typeof notificationSchema>;
export type NotificationList = z.infer<typeof notificationListSchema>;

export async function getNotifications(): Promise<NotificationList> {
  const response = await apiClient<unknown>("/api/notifications");

  return notificationListSchema.parse(response);
}

export async function markNotificationsRead(): Promise<void> {
  await apiClient<void>("/api/notifications/read", { method: "POST" });
}

export async function deleteNotification(id: string): Promise<void> {
  await apiClient<void>(`/api/notifications/${id}`, { method: "DELETE" });
}

export async function clearNotifications(): Promise<void> {
  await apiClient<void>("/api/notifications", { method: "DELETE" });
}
