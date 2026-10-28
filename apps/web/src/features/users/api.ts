import { z } from "zod";
import { idSchema } from "@/lib/schemas/id";
import { ApiError, apiClient, withReason } from "@/lib/api/client";
import {
  pagedSchema,
  toQueryString,
  type Paged,
  type TableQuery,
} from "@/lib/api/paged";

const userSchema = z.object({
  id: idSchema,
  name: z.string(),
  email: z.string(),
  employeeNumber: z.string().nullable(),
  department: z.string().nullable(),
  departemenCode: z.string().nullable().default(null),
  jobTitle: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  groups: z.array(z.object({ id: idSchema, name: z.string() })).default([]),
});

export const usersSchema = z.array(userSchema);

const createUserSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().min(1),
  password: z.string().min(12),
  employeeNumber: z.string().trim().nullable(),
  department: z.string().trim().min(1),
  jobTitle: z.string().trim().nullable().optional(),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().min(1),
  employeeNumber: z.string().trim().nullable(),
  department: z.string().trim().nullable(),
  jobTitle: z.string().trim().nullable().optional(),
  isActive: z.boolean(),
});

const createUserResponseSchema = z.object({
  userId: idSchema,
});

export type PortalUser = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export async function getUser(userId: string): Promise<PortalUser | null> {
  try {
    const response = await apiClient<unknown>(`/api/admin/users/${userId}`);

    return userSchema.parse(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

const userSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  inactive: z.number().int().nonnegative(),
});

export type UserSummary = z.infer<typeof userSummarySchema>;

export async function getUserSummary(): Promise<UserSummary> {
  const response = await apiClient<unknown>("/api/admin/users/summary");

  return userSummarySchema.parse(response);
}

const usersPageSchema = pagedSchema(userSchema);

export async function getUsersPage(
  query: TableQuery,
): Promise<Paged<PortalUser>> {
  const response = await apiClient<unknown>(
    `/api/admin/users/page?${toQueryString(query)}`,
  );

  return usersPageSchema.parse(response);
}

export async function createUser(
  input: CreateUserInput,
): Promise<{ userId: string }> {
  const data = createUserSchema.parse(input);

  const response = await apiClient<unknown>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return createUserResponseSchema.parse(response);
}

export async function updateUser(
  userId: string,
  input: UpdateUserInput,
): Promise<void> {
  const data = updateUserSchema.parse(input);

  await apiClient<void>(`/api/admin/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(
  userId: string,
  reason: string,
): Promise<void> {
  await apiClient<void>(withReason(`/api/admin/users/${userId}`, reason), {
    method: "DELETE",
  });
}
