import { z } from "zod";
import { idSchema } from "@/lib/schemas/id";
import { apiClient, withReason } from "@/lib/api/client";
import {
  pagedSchema,
  toQueryString,
  type Paged,
  type TableQuery,
} from "@/lib/api/paged";

const adminApplicationSchema = z.object({
  id: idSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  launchUrl: z.string(),
  appUrl: z.string().default(""),
  callbackPath: z.string().nullable().default(null),
  category: z.string(),
  icon: z.string(),
  color: z.string(),
  status: z.enum(["active", "maintenance", "inactive"]),
  maintenanceMessage: z.string().default(""),
  usesSso: z.boolean().default(true),
  isActive: z.boolean(),
  userCount: z.number(),
  credentialCount: z.number().default(0),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

const adminApplicationsSchema = z.array(adminApplicationSchema);

const applicationInputSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  description: z.string().trim(),
  launchUrl: z.string().trim().default(""),
  appUrl: z.string().trim().default(""),
  callbackPath: z.string().trim().nullable().default(null),
  category: z.string().trim(),
  icon: z.string().trim(),
  color: z.string().trim(),
  status: z.enum(["active", "maintenance", "inactive"]),
  maintenanceMessage: z.string().trim().default(""),
  usesSso: z.boolean(),
});

const createApplicationResponseSchema = z.object({
  id: idSchema,
});

export type AdminApplication = z.infer<typeof adminApplicationSchema>;
export type ApplicationInput = z.input<typeof applicationInputSchema>;

export async function getAdminApplications(): Promise<AdminApplication[]> {
  const response = await apiClient<unknown>("/api/admin/applications");

  return adminApplicationsSchema.parse(response);
}

const applicationSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  maintenance: z.number().int().nonnegative(),
  inactive: z.number().int().nonnegative(),
});

export type ApplicationSummary = z.infer<typeof applicationSummarySchema>;

export async function getApplicationsSummary(): Promise<ApplicationSummary> {
  const response = await apiClient<unknown>("/api/admin/applications/summary");

  return applicationSummarySchema.parse(response);
}

const adminApplicationsPageSchema = pagedSchema(adminApplicationSchema);

export async function getAdminApplicationsPage(
  query: TableQuery,
): Promise<Paged<AdminApplication>> {
  const response = await apiClient<unknown>(
    `/api/admin/applications/page?${toQueryString(query)}`,
  );

  return adminApplicationsPageSchema.parse(response);
}

export async function createApplication(
  input: ApplicationInput,
): Promise<{ id: string }> {
  const data = applicationInputSchema.parse(input);

  const response = await apiClient<unknown>("/api/admin/applications", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return createApplicationResponseSchema.parse(response);
}

export async function updateApplication(
  applicationId: string,
  input: ApplicationInput,
): Promise<void> {
  const data = applicationInputSchema.parse(input);

  await apiClient<void>(`/api/admin/applications/${applicationId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteApplication(
  applicationId: string,
  reason: string,
): Promise<void> {
  await apiClient<void>(
    withReason(`/api/admin/applications/${applicationId}`, reason),
    {
      method: "DELETE",
    },
  );
}

const applicationUserSchema = z.object({
  userId: idSchema,
  name: z.string(),
  email: z.string(),
  department: z.string().nullable(),
  departemenCode: z.string().nullable().default(null),
  jobTitle: z.string().nullable(),
  isActive: z.boolean(),
  groupNames: z.array(z.string()),
});

export type ApplicationUser = z.infer<typeof applicationUserSchema>;

export async function getApplicationUsers(
  applicationId: string,
): Promise<ApplicationUser[]> {
  const response = await apiClient<unknown>(
    `/api/admin/applications/${applicationId}/users`,
  );

  return z.array(applicationUserSchema).parse(response);
}
