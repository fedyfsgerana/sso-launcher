import { z } from "zod";
import { idSchema } from "@/lib/schemas/id";
import { apiClient } from "@/lib/api/client";

const auditLogSchema = z.object({
  id: idSchema,
  actorId: idSchema.nullable(),
  actorName: z.string(),
  action: z.string(),
  targetType: z.string(),
  targetId: idSchema.nullable(),
  targetName: z.string(),
  summary: z.string(),
  occurredAt: z.iso.datetime({ offset: true }),
  module: z.string(),
  outcome: z.string(),
  reason: z.string().nullable(),
  ipAddress: z.string().nullable(),
  deviceName: z.string().nullable(),
  deviceType: z.string().nullable(),
  operatingSystem: z.string().nullable(),
  browser: z.string().nullable(),
  browserVersion: z.string().nullable(),
  hasChanges: z.boolean(),
});

const auditChangeSchema = z.object({
  field: z.string(),
  before: z.unknown(),
  after: z.unknown(),
});

const auditDetailSchema = z.object({
  id: idSchema,
  actorId: idSchema.nullable(),
  actorName: z.string(),
  action: z.string(),
  outcome: z.string(),
  module: z.string(),
  targetType: z.string(),
  targetId: idSchema.nullable(),
  targetName: z.string(),
  summary: z.string(),
  reason: z.string().nullable(),
  occurredAt: z.iso.datetime({ offset: true }),
  ipAddress: z.string().nullable(),
  deviceName: z.string().nullable(),
  deviceType: z.string().nullable(),
  operatingSystem: z.string().nullable(),
  browser: z.string().nullable(),
  browserVersion: z.string().nullable(),
  userAgent: z.string().nullable(),
  sessionRef: z.string().nullable(),
  requestId: z.string().nullable(),
  httpMethod: z.string().nullable(),
  requestPath: z.string().nullable(),
  version: z.number().nullable(),
  changes: z.array(auditChangeSchema),
});

const auditPageSchema = z.object({
  items: z.array(auditLogSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;
export type AuditLogPage = z.infer<typeof auditPageSchema>;
export type AuditChange = z.infer<typeof auditChangeSchema>;
export type AuditLogDetail = z.infer<typeof auditDetailSchema>;

export type AuditLogFilter = {
  page: number;
  pageSize: number;
  action?: string;
  targetType?: string;
  search?: string;
  targetId?: string;
  actorId?: string;
  from?: string;
  to?: string;
  module?: string;
  outcome?: string;
  ip?: string;
  sort?: string;
  direction?: "asc" | "desc";
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

function buildParams(filter: Partial<AuditLogFilter>) {
  const params = new URLSearchParams();

  const entries: Array<[string, string | number | undefined]> = [
    ["page", filter.page],
    ["pageSize", filter.pageSize],
    ["action", filter.action],
    ["targetType", filter.targetType],
    ["search", filter.search],
    ["targetId", filter.targetId],
    ["actorId", filter.actorId],
    ["from", filter.from],
    ["to", filter.to],
    ["module", filter.module],
    ["outcome", filter.outcome],
    ["ip", filter.ip],
    ["sort", filter.sort],
    ["direction", filter.direction],
  ];

  for (const [key, value] of entries) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  return params;
}

export async function getAuditLogs(
  filter: AuditLogFilter,
): Promise<AuditLogPage> {
  const response = await apiClient<unknown>(
    `/api/admin/audit-logs?${buildParams(filter).toString()}`,
  );

  return auditPageSchema.parse(response);
}

export async function getAuditLogDetail(id: string): Promise<AuditLogDetail> {
  const response = await apiClient<unknown>(`/api/admin/audit-logs/${id}`);

  return auditDetailSchema.parse(response);
}

const summarySchema = z.object({
  today: z.number(),
  lastSevenDays: z.number(),
  deletionsLastSevenDays: z.number(),
  failedLastSevenDays: z.number(),
});

const actorSchema = z.object({
  actorId: idSchema,
  name: z.string(),
});

export type AuditSummary = z.infer<typeof summarySchema>;
export type AuditActor = z.infer<typeof actorSchema>;

export async function getAuditSummary(): Promise<AuditSummary> {
  const offset = -new Date().getTimezoneOffset();
  const response = await apiClient<unknown>(
    `/api/admin/audit-logs/summary?utcOffsetMinutes=${offset}`,
  );

  return summarySchema.parse(response);
}

export async function getAuditActors(): Promise<AuditActor[]> {
  const response = await apiClient<unknown>("/api/admin/audit-logs/actors");

  return z.array(actorSchema).parse(response);
}

export async function exportAuditLogs(
  filter: Omit<AuditLogFilter, "page" | "pageSize">,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/admin/audit-logs/export?${buildParams(filter).toString()}`,
    { credentials: "include" },
  );

  if (!response.ok) {
    throw new Error(`Export failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");

  link.href = url;
  link.download = `riwayat-aktivitas-${stamp}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
