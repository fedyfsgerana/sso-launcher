import { z } from "zod";
import { idSchema } from "@/lib/schemas/id";
import { apiClient } from "@/lib/api/client";
import type { PortalMenuItem } from "@/types/portal";

const menuSchema = z.object({
  id: idSchema,
  parentId: idSchema.nullable(),
  label: z.string(),
  icon: z.string(),
  targetType: z.enum(["page", "custom", "url", "section"]),
  targetValue: z.string(),
  sortOrder: z.number(),
  maintenanceActive: z.boolean(),
  maintenanceTitle: z.string().nullable(),
  maintenanceMessage: z.string().nullable(),
  actions: z.array(z.string()).default([]),
});

const menusSchema = z.array(menuSchema);

export async function getMyMenus(): Promise<PortalMenuItem[]> {
  const response = await apiClient<unknown>("/api/menus/me");

  return menusSchema.parse(response);
}
