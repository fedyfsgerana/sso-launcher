"use client";

import { useState } from "react";
import { useToast } from "@/components/portal/toast";
import { exportAuditLogs } from "@/features/audit/api";
import {
  auditQueryFilters,
  type AuditFilterState,
} from "@/features/audit/audit-filters";
import type { SortState } from "@/lib/portal/use-server-table";

type AuditExportQuery = Readonly<{
  filters: AuditFilterState;
  search: string;
  sort: SortState;
}>;

export function useAuditExport() {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);

  async function exportExcel({ filters, search, sort }: AuditExportQuery) {
    setExporting(true);

    try {
      await exportAuditLogs({
        ...auditQueryFilters(filters),
        search: search.trim() || undefined,
        sort: sort?.key,
        direction: sort?.direction,
      });
      showToast("Riwayat diekspor ke Excel");
    } catch {
      showToast("Ekspor gagal. Coba persempit rentang tanggal.", "error");
    } finally {
      setExporting(false);
    }
  }

  return { exporting, exportExcel };
}
