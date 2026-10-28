import { z } from "zod";
import { idSchema } from "@/lib/schemas/id";
import { apiClient } from "@/lib/api/client";
import type { PortalApplication } from "@/types/portal";

export {
  getAdminApplications,
  createApplication,
  updateApplication,
  type AdminApplication,
  type ApplicationInput,
} from "@/features/applications/admin-api";

const myApplicationSchema = z.object({
  id: idSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  launchUrl: z.string(),
  category: z.string(),
  icon: z.string(),
  color: z.string(),
  status: z.enum(["active", "maintenance", "inactive"]),
  maintenanceMessage: z.string().default(""),
  usesSso: z.boolean().default(true),
  isFavorite: z.boolean(),
  lastOpenedAt: z.iso.datetime({ offset: true }).nullable(),
});

const myApplicationsSchema = z.array(myApplicationSchema);

export async function getMyApplications(): Promise<PortalApplication[]> {
  const response = await apiClient<unknown>("/api/applications/me");

  return myApplicationsSchema.parse(response);
}
