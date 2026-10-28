import { z } from "zod";
import { idSchema } from "@/lib/schemas/id";
import {
  pagedSchema,
  toQueryString,
  type Paged,
  type TableQuery,
} from "@/lib/api/paged";
import { apiClient, withReason } from "@/lib/api/client";
import { usersSchema, type PortalUser } from "@/features/users/api";

const groupSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string(),
  department: z.string().nullable().default(null),
  departemenCode: z.string().nullable().default(null),
  isActive: z.boolean(),
  memberCount: z.number(),
  applicationCount: z.number(),
  menuCount: z.number().default(0),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

const groupsSchema = z.array(groupSchema);

const memberSchema = z.object({
  userId: idSchema,
  name: z.string(),
  email: z.string(),
  department: z.string().nullable(),
  departemenCode: z.string().nullable().default(null),
  jobTitle: z.string().nullable(),
  isActive: z.boolean(),
});

const accessSchema = z.object({
  applicationId: idSchema,
  applicationName: z.string(),
  category: z.string(),
  icon: z.string(),
  color: z.string(),
  status: z.enum(["active", "maintenance", "inactive"]),
});

const applicationOptionSchema = z.object({
  id: idSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  category: z.string(),
  icon: z.string(),
  color: z.string(),
  status: z.enum(["active", "maintenance", "inactive"]),
});

const applicationOptionsSchema = z.array(applicationOptionSchema);

const groupMenuSchema = z.object({
  menuId: idSchema,
  parentId: idSchema.nullable(),
  label: z.string(),
  icon: z.string(),
  isActive: z.boolean(),
});

const groupMenuActionSchema = z.object({
  menuId: idSchema,
  actionKey: z.string(),
});

const groupDetailSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string(),
  department: z.string().nullable().default(null),
  departemenCode: z.string().nullable().default(null),
  isActive: z.boolean(),
  members: z.array(memberSchema),
  accesses: z.array(accessSchema),
  menus: z.array(groupMenuSchema),
  menuActions: z.array(groupMenuActionSchema).default([]),
});

const createGroupResponseSchema = z.object({
  groupId: idSchema,
});

const groupNameOptionSchema = z.object({
  name: z.string(),
  groupId: idSchema.nullable(),
});

const groupNameOptionsSchema = z.array(groupNameOptionSchema);

export type UserGroup = z.infer<typeof groupSchema>;
export type UserGroupDetail = z.infer<typeof groupDetailSchema>;
export type UserGroupMember = z.infer<typeof memberSchema>;
export type UserGroupAccess = z.infer<typeof accessSchema>;
export type UserGroupMenu = z.infer<typeof groupMenuSchema>;
export type GroupApplicationOption = z.infer<typeof applicationOptionSchema>;
export type GroupNameOption = z.infer<typeof groupNameOptionSchema>;

export type SaveGroupInput = {
  name: string;
  description: string;
  department: string | null;
  isActive: boolean;
};

const groupSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  inactive: z.number().int().nonnegative(),
  withoutMembers: z.number().int().nonnegative(),
});

export type GroupSummary = z.infer<typeof groupSummarySchema>;

export async function getGroupsSummary(): Promise<GroupSummary> {
  const response = await apiClient<unknown>("/api/admin/groups/summary");

  return groupSummarySchema.parse(response);
}

const groupsPageSchema = pagedSchema(groupSchema);

export async function getGroupsPage(
  query: TableQuery,
): Promise<Paged<UserGroup>> {
  const response = await apiClient<unknown>(
    `/api/admin/groups/page?${toQueryString(query)}`,
  );

  return groupsPageSchema.parse(response);
}

export async function getGroups(): Promise<UserGroup[]> {
  const response = await apiClient<unknown>("/api/admin/groups");

  return groupsSchema.parse(response);
}

export async function getGroupApplicationOptions(): Promise<
  GroupApplicationOption[]
> {
  const response = await apiClient<unknown>(
    "/api/admin/groups/application-options",
  );

  return applicationOptionsSchema.parse(response);
}

const userOptionsPageSchema = pagedSchema(usersSchema.element);

export async function getGroupUserOptionsPage(
  groupId: string,
  query: TableQuery,
): Promise<Paged<PortalUser>> {
  const response = await apiClient<unknown>(
    `/api/admin/groups/${groupId}/user-options/page?${toQueryString(query)}`,
  );

  return userOptionsPageSchema.parse(response);
}

export async function getGroupDetail(
  groupId: string,
): Promise<UserGroupDetail> {
  const response = await apiClient<unknown>(`/api/admin/groups/${groupId}`);

  return groupDetailSchema.parse(response);
}

export async function createGroup(
  input: SaveGroupInput,
): Promise<{ groupId: string }> {
  const response = await apiClient<unknown>("/api/admin/groups", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return createGroupResponseSchema.parse(response);
}

export async function updateGroup(
  groupId: string,
  input: SaveGroupInput,
): Promise<void> {
  await apiClient<void>(`/api/admin/groups/${groupId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteGroup(
  groupId: string,
  reason: string,
): Promise<void> {
  await apiClient<void>(withReason(`/api/admin/groups/${groupId}`, reason), {
    method: "DELETE",
  });
}

export async function setGroupMembers(
  groupId: string,
  userIds: string[],
): Promise<void> {
  await apiClient<void>(`/api/admin/groups/${groupId}/members`, {
    method: "PUT",
    body: JSON.stringify({ userIds }),
  });
}

export async function setGroupAccess(
  groupId: string,
  applicationIds: string[],
): Promise<void> {
  await apiClient<void>(`/api/admin/groups/${groupId}/access`, {
    method: "PUT",
    body: JSON.stringify({
      accesses: applicationIds.map((applicationId) => ({ applicationId })),
    }),
  });
}

export type GroupMenuActionInput = {
  menuId: string;
  actionKey: string;
};

export async function setGroupMenuAccess(
  groupId: string,
  menuIds: string[],
  actions: GroupMenuActionInput[] = [],
): Promise<void> {
  await apiClient<void>(`/api/admin/groups/${groupId}/menus`, {
    method: "PUT",
    body: JSON.stringify({ menuIds, actions }),
  });
}

export async function duplicateGroup(
  groupId: string,
  name: string,
): Promise<string> {
  const response = await apiClient<unknown>(
    `/api/admin/groups/${groupId}/duplicate`,
    {
      method: "POST",
      body: JSON.stringify({ name }),
    },
  );

  return createGroupResponseSchema.parse(response).groupId;
}

export async function getGroupNameOptions(
  departmentCode: string,
): Promise<GroupNameOption[]> {
  const response = await apiClient<unknown>(
    `/api/admin/groups/name-options?departmentCode=${encodeURIComponent(departmentCode)}`,
  );

  return groupNameOptionsSchema.parse(response);
}
