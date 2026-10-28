import { z } from "zod";
import { idSchema } from "@/lib/schemas/id";
import { apiClient } from "@/lib/api/client";

export const RECYCLE_TYPES = [
  { value: "user", label: "Pengguna" },
  { value: "application", label: "Aplikasi" },
  { value: "user_group", label: "Grup" },
  { value: "portal_menu", label: "Menu Portal" },
  { value: "access", label: "Akses Langsung" },
] as const;

export type RecycleType = (typeof RECYCLE_TYPES)[number]["value"];

const deletedItemSchema = z.object({
  id: idSchema,
  name: z.string(),
  detail: z.string(),
  deletedAt: z.iso.datetime({ offset: true }),
  deletedByName: z.string().nullable().optional(),
  deleteReason: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

const deletedItemsSchema = z.array(deletedItemSchema);

export type DeletedItem = z.infer<typeof deletedItemSchema>;

export function recycleTypeLabel(type: string): string {
  return RECYCLE_TYPES.find((item) => item.value === type)?.label ?? type;
}

export async function getDeletedRecords(
  type: RecycleType,
): Promise<DeletedItem[]> {
  const response = await apiClient<unknown>(`/api/admin/recycle-bin/${type}`);

  return deletedItemsSchema.parse(response);
}

export async function restoreRecord(
  type: RecycleType,
  id: string,
): Promise<void> {
  await apiClient<void>(`/api/admin/recycle-bin/${type}/${id}/restore`, {
    method: "POST",
  });
}
