import { z } from "zod";
import { idSchema } from "@/lib/schemas/id";
import { apiClient, withReason } from "@/lib/api/client";

const portalMenuSchema = z.object({
  id: idSchema,
  parentId: idSchema.nullable(),
  label: z.string(),
  icon: z.string(),
  targetType: z.enum(["page", "custom", "url", "section"]),
  targetValue: z.string(),
  sortOrder: z.number(),
  isSystem: z.boolean(),
  isActive: z.boolean(),
  maintenanceActive: z.boolean(),
  maintenanceTitle: z.string().nullable(),
  maintenanceMessage: z.string().nullable(),
  groupIds: z.array(idSchema).default([]),
  groupNames: z.array(z.string()).default([]),
  updatedAt: z.string(),
});

const portalMenusSchema = z.array(portalMenuSchema);

const menuInputSchema = z
  .object({
    label: z.string().trim().min(1).max(60),
    icon: z.string().trim(),
    parentId: idSchema.nullable(),
    targetType: z.enum(["page", "custom", "url", "section"]),
    targetValue: z.string().trim(),
    isActive: z.boolean(),
  })
  .refine(
    (value) => value.targetType === "section" || value.targetValue.length > 0,
    { path: ["targetValue"] },
  );

const reorderPortalMenusSchema = z.object({
  items: z.array(
    z.object({
      id: idSchema,
      parentId: idSchema.nullable(),
      sortOrder: z.number().int().nonnegative(),
    }),
  ),
});

export type AdminPortalMenu = z.infer<typeof portalMenuSchema>;
export type PortalMenuInput = z.infer<typeof menuInputSchema>;
export type PortalMenuOrderItem = z.infer<
  typeof reorderPortalMenusSchema
>["items"][number];

export async function getPortalMenus(): Promise<AdminPortalMenu[]> {
  const response = await apiClient<unknown>("/api/admin/menus");

  return portalMenusSchema.parse(response);
}

export async function createPortalMenu(
  input: PortalMenuInput,
): Promise<string> {
  const data = menuInputSchema.parse(input);

  const response = await apiClient<unknown>("/api/admin/menus", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return z.object({ menuId: idSchema }).parse(response).menuId;
}

export async function updatePortalMenu(
  menuId: string,
  input: PortalMenuInput,
): Promise<void> {
  const data = menuInputSchema.parse(input);

  await apiClient<void>(`/api/admin/menus/${menuId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePortalMenu(
  menuId: string,
  reason: string,
  moveTo: string | null = null,
): Promise<void> {
  const path = moveTo
    ? `/api/admin/menus/${menuId}?moveTo=${encodeURIComponent(moveTo)}`
    : `/api/admin/menus/${menuId}`;

  await apiClient<void>(withReason(path, reason), {
    method: "DELETE",
  });
}

export async function reorderPortalMenus(
  items: PortalMenuOrderItem[],
): Promise<void> {
  const data = reorderPortalMenusSchema.parse({ items });

  await apiClient<void>("/api/admin/menus/reorder", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function setPortalMenuGroups(
  menuId: string,
  groupIds: string[],
): Promise<void> {
  await apiClient<void>(`/api/admin/menus/${menuId}/groups`, {
    method: "PUT",
    body: JSON.stringify({ groupIds }),
  });
}

export type MenuMaintenanceInput = {
  active: boolean;
  title: string;
  message: string;
};

export async function setMenuMaintenance(
  menuId: string,
  input: MenuMaintenanceInput,
): Promise<void> {
  await apiClient<void>(`/api/admin/menus/${menuId}/maintenance`, {
    method: "PUT",
    body: JSON.stringify({
      active: input.active,
      title: input.title.trim(),
      message: input.message.trim(),
    }),
  });
}

const menuActionDefinitionSchema = z.object({
  menuTarget: z.string(),
  key: z.string(),
  label: z.string(),
  description: z.string(),
});

export type MenuActionDefinition = z.infer<typeof menuActionDefinitionSchema>;

export async function getMenuActionCatalog(): Promise<MenuActionDefinition[]> {
  const response = await apiClient<unknown>("/api/admin/menus/actions");

  return z.array(menuActionDefinitionSchema).parse(response);
}
