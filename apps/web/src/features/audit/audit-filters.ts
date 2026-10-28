import {
  getAuditLogs,
  type AuditLogFilter,
  type AuditLogPage,
} from "@/features/audit/api";
import type { TableQuery } from "@/lib/api/paged";

export type AuditFilterState = Readonly<{
  action: string;
  module: string;
  outcome: string;
  actorId: string;
  fromDate: string;
  toDate: string;
}>;

export const EMPTY_AUDIT_FILTERS: AuditFilterState = {
  action: "",
  module: "",
  outcome: "",
  actorId: "",
  fromDate: "",
  toDate: "",
};

function dayStart(value: string) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : "";
}

function dayEnd(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);

  return date.toISOString();
}

export function auditQueryFilters(filters: AuditFilterState) {
  return {
    action: filters.action,
    module: filters.module,
    outcome: filters.outcome,
    actorId: filters.actorId,
    from: dayStart(filters.fromDate),
    to: dayEnd(filters.toDate),
  };
}

export function hasAuditFilters(filters: AuditFilterState) {
  return Object.values(filters).some(Boolean);
}

export function fetchAuditPage(query: TableQuery): Promise<AuditLogPage> {
  return getAuditLogs({ ...query } as AuditLogFilter);
}
